import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { demoIds, renderRegistry } from "../../scripts/gen-demo-registry";
import { readGroupOrder } from "../../scripts/previews/demo-source";

/**
 * The demo tree, the generated registry and the captured media must agree.
 *
 * Read as **text**, importing nothing from the tree. A demo imports
 * `react-native`, whose Flow-typed source Bun's transpiler cannot parse — the
 * same reason `bun test` in the library covers pure logic only. That is the
 * move available whenever a convention is real but no renderer can check it,
 * and `packages/native-ui/src/docs.test.ts` is the precedent.
 *
 * What each assertion is actually protecting:
 *
 * - A demo added on a branch where nobody ran the generator is invisible to the
 *   app, and the failure is a blank preview route rather than an error.
 * - A demo listed for capture but never captured publishes a broken image.
 * - Media left behind by a deleted demo sits in the repository forever.
 * - A component with no demo at all is the `Radio` failure again: exported,
 *   rendered, and undocumented for fifteen commits because nothing was looking.
 */

const PLAYGROUND = join(import.meta.dirname, "..", "..");
const REPO = join(PLAYGROUND, "..", "..");
const DEMOS = join(PLAYGROUND, "src", "demos");
const MEDIA = join(REPO, "apps", "web", "public", "previews");
const MANIFEST = join(REPO, "apps", "web", "src", "previews", "manifest.ts");
const FLOWS = join(REPO, ".argent", "flows", "previews");
const COMPONENTS = join(REPO, "packages", "native-ui", "src", "components");

/**
 * `DelacourProvider` has no demo on purpose.
 *
 * It has nothing to render — every route in the playground already renders
 * downstream of it, which is a stronger check than a readout page. The
 * library's own docs make the same exception for its gallery.
 */
const COMPONENTS_WITHOUT_DEMOS = new Set(["provider"]);

function demoFiles(): string[] {
	const found: string[] = [];
	const walk = (dir: string): void => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) walk(path);
			else if (entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) found.push(path);
		}
	};
	walk(DEMOS);
	return found.map((path) => relative(DEMOS, path).replace(/\.tsx$/, "")).sort();
}

/** Component folder names under `src/demos`, which is a demo id's first segment. */
function demoComponents(): Set<string> {
	return new Set(demoFiles().map((id) => id.split("/")[0] as string));
}

/** The manifest read as text — importing it would pull a generated module into the suite. */
function manifestSource(): string {
	return existsSync(MANIFEST) ? readFileSync(MANIFEST, "utf-8") : "";
}

function manifestIds(): string[] {
	return [...manifestSource().matchAll(/^\t"([^"]+)": \{$/gm)].map(([, id]) => id as string);
}

/** Every demo whose `meta` opts into capture, found without executing the module. */
function capturedIds(): string[] {
	return demoFiles().filter((id) => {
		const source = readFileSync(join(DEMOS, `${id}.tsx`), "utf-8");
		return /^\s*capture:\s*\{/m.test(source);
	});
}

/**
 * Every directory under the published media tree that actually holds images.
 *
 * Found by recursing to the leaf rather than assuming a demo sits two levels
 * down — a folder gallery nests one deeper, and a fixed-depth walk would read
 * `tabs/variants` as a demo of its own.
 */
function mediaDirectories(): string[] {
	const found: string[] = [];
	if (!existsSync(MEDIA)) return found;

	const visit = (dir: string): void => {
		const entries = readdirSync(dir, { withFileTypes: true });
		if (entries.some((entry) => entry.isFile() && /\.(png|mp4)$/.test(entry.name))) {
			found.push(relative(MEDIA, dir));
			return;
		}
		for (const entry of entries) if (entry.isDirectory()) visit(join(dir, entry.name));
	};

	visit(MEDIA);
	return found;
}

const FILES = demoFiles();

describe("demos", () => {
	// A walker that found nothing would let every assertion below pass on an
	// empty set, and the suite would stay green while the convention rotted.
	test("finds the demo tree", () => {
		expect(FILES.length).toBeGreaterThan(20);
	});

	// A demo's barrel is its **own** directory's `index.ts`, not its component's.
	// A folder gallery nests (`field/anatomy/all-four`), and its component-level
	// barrel is a `concatDemoGroups` of the facets rather than a list of demos.
	test("every demo is listed in its own directory's barrel", async () => {
		const listed = new Map<string, string[]>();
		for (const id of FILES) {
			const dir = dirname(id);
			if (listed.has(dir)) continue;
			const barrel = join(DEMOS, dir, "index.ts");
			listed.set(dir, existsSync(barrel) ? await readGroupOrder(barrel) : []);
		}

		const unlisted = FILES.filter((id) => !listed.get(dirname(id))?.includes(basename(id)));
		expect(unlisted).toEqual([]);
	});

	test("registry.ts is not stale", async () => {
		const expected = renderRegistry(await demoIds());
		expect(readFileSync(join(DEMOS, "registry.ts"), "utf-8")).toEqual(expected);
	});

	// Required only where a component captures something. BottomSheet has demos
	// and no captures — every one is a closed sheet behind a trigger, so a
	// screenshot would be a picture of a button — and a component that publishes
	// no media needs nothing to front its card.
	test("exactly one demo per capturing component is the hero", () => {
		const captured = capturedIds();
		const wrong: string[] = [];

		for (const component of new Set(captured.map((id) => id.split("/")[0] as string))) {
			const heroes = captured.filter(
				(id) => id.startsWith(`${component}/`) && /hero:\s*true/.test(readFileSync(join(DEMOS, `${id}.tsx`), "utf-8"))
			);
			if (heroes.length !== 1) wrong.push(`${component} has ${heroes.length}`);
		}

		expect(wrong).toEqual([]);
	});

	test("every animated demo names a flow that exists", () => {
		const missing: string[] = [];
		for (const id of FILES) {
			const source = readFileSync(join(DEMOS, `${id}.tsx`), "utf-8");
			const flow = source.match(/flow:\s*"([^"]+)"/)?.[1];
			if (flow && !existsSync(join(FLOWS, `${flow}.yaml`))) missing.push(`${id} → ${flow}.yaml`);
		}
		expect(missing).toEqual([]);
	});
});

describe("captured previews", () => {
	test("every captured demo has a manifest entry", () => {
		const ids = new Set(manifestIds());
		expect(capturedIds().filter((id) => !ids.has(id))).toEqual([]);
	});

	test("every manifest entry's media exists", () => {
		const missing: string[] = [];
		for (const id of manifestIds()) {
			for (const theme of ["light", "dark"]) {
				if (!existsSync(join(MEDIA, id, `${theme}.png`))) missing.push(`${id}/${theme}.png`);
			}
		}
		expect(missing).toEqual([]);
	});

	// A demo can be deleted; its pictures cannot delete themselves.
	test("no media is left behind by a deleted demo", () => {
		const known = new Set(manifestIds());
		expect(mediaDirectories().filter((id) => !known.has(id))).toEqual([]);
	});

	// The mirror of the two above, and the gap they left between them: both
	// compare media against the MANIFEST, so a manifest that still names a
	// deleted demo agrees with its own leftover media and nothing complains —
	// while the documentation site publishes a card for a demo nobody can open.
	// Only the demo tree can settle it.
	test("no manifest entry outlives its demo", () => {
		const live = new Set(demoFiles());
		expect(manifestIds().filter((id) => !live.has(id))).toEqual([]);
	});
});

describe("coverage", () => {
	// The assertion that would have caught Radio.
	test("every component in the library has at least one demo", () => {
		const folders = readdirSync(COMPONENTS, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.filter((name) => !COMPONENTS_WITHOUT_DEMOS.has(name));

		const have = demoComponents();
		expect(folders.filter((name) => !have.has(name))).toEqual([]);
	});
});
