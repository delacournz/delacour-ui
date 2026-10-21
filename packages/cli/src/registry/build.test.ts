import { beforeAll, describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { type BuildResult, buildRegistry, escapingReads, runnerSpecificUses } from "./build";
import { isTest } from "./classify";
import { PLACEHOLDER_PREFIX, parsePlaceholder } from "./namespaces";
import { applyRewrites } from "./rewrite";
import { scanImports } from "./scan-imports";
import type { RegistryFile, RegistryItem } from "./schema";
import { findUnshippableReferences, shipContent } from "./ship";

/**
 * Built against the real `packages/react-native-ui`, not a fixture.
 *
 * A fixture would only assert that the builder agrees with a copy of the
 * conventions rather than with the library itself, and the whole point of
 * deriving the registry is that the two cannot diverge.
 */
const PACKAGE_ROOT = join(import.meta.dirname, "../../../react-native-ui");
const PACKAGE_DIR = "packages/react-native-ui";
/** What `files[].path` resolves against, the way a ref does over HTTP. */
const REPO_ROOT = join(PACKAGE_ROOT, "../..");

let registry: BuildResult;
let byName: Map<string, RegistryItem>;
/**
 * What a consumer receives, keyed by path: the library file with the item's
 * rewrites applied. The builder no longer produces this — that is the point —
 * so the tests below reconstruct it exactly as `client.loadItem` does, which
 * makes them assertions about the shipped artifact rather than about a copy.
 */
let delivered: Map<string, string>;

beforeAll(async () => {
	registry = await buildRegistry({ packageRoot: PACKAGE_ROOT, packageDir: PACKAGE_DIR });
	byName = new Map(registry.items.map((item) => [item.name, item]));

	delivered = new Map();
	for (const item of registry.items) {
		for (const file of [...item.files, ...item.tests]) {
			const source = await readFile(join(REPO_ROOT, file.path), "utf-8");
			delivered.set(file.path, shipContent(file.target, applyRewrites(source, file.rewrites)));
		}
	}
});

describe("buildRegistry", () => {
	// The guard the builder also enforces, held here over what a consumer
	// actually receives: a copy lands on any package manager with none of the
	// library's tests, so it must cite neither. A test is exempt — it is Bun's
	// by nature and only lands under `add --tests`, beside its own suite.
	test("nothing shipped cites Bun or a file the registry does not ship", () => {
		const offences = [...delivered]
			.filter(([path]) => !isTest(path))
			.flatMap(([path, content]) =>
				findUnshippableReferences(content).map(({ line, match }) => `${path}:${line} ${match}`)
			);

		expect(offences).toEqual([]);
	});

	test("a copied Files table lists the folder as it lands, without its tests", async () => {
		const path = "packages/react-native-ui/src/components/button/AGENTS.md";
		const source = await readFile(join(REPO_ROOT, path), "utf-8");

		expect(source).toContain("`button.variants.test.ts`");
		expect(delivered.get(path)).not.toContain("button.variants.test.ts");
		expect(delivered.get(path)).toContain("| `button.variants.ts` |");
	});

	test("emits one ui item per component folder, and no others", async () => {
		const folders = (await readdir(join(PACKAGE_ROOT, "src/components"), { withFileTypes: true }))
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.sort();

		const ui = registry.items.filter((item) => item.type === "registry:ui").map((item) => item.name);
		expect(ui).toEqual(folders);
	});

	test("derives the component graph from the imports, direct edges only", () => {
		// `styles` reaches button through `tv`, not directly — the closure is
		// `add`'s job, and recording it here would hide a real edge going missing.
		//
		// `separator` is here because `Button.Group.Separator` draws its rule with
		// one. The edge runs that way only: a separator knows nothing about a
		// group, which is what the last assertion in this test holds.
		expect(byName.get("button")?.registryDependencies).toEqual([
			"icon",
			"pressable",
			"separator",
			"spinner",
			"text",
			"tv",
		]);
		expect(byName.get("tv")?.registryDependencies).toEqual(["styles"]);
		expect(byName.get("list-group")?.registryDependencies).toContain("icons");
		expect(byName.get("separator")?.registryDependencies).not.toContain("button");
	});

	test("adds the registry edges ITEM_META names, for a pairing no import records", () => {
		// SectionRail never imports useScrollSections — the caller wires the hook's
		// value into the rail — but every documented use needs both, so `add`
		// brings the hook along.
		expect(byName.get("section-rail")?.registryDependencies).toContain("use-scroll-sections");
	});

	test("routes native modules to expo install and plain packages to the package manager", () => {
		const pressable = byName.get("pressable");
		expect(pressable?.expoDependencies).toContain("react-native-reanimated");
		expect(pressable?.expoDependencies).toContain("react-native-gesture-handler");
		expect(pressable?.dependencies).not.toContain("react-native-reanimated");

		expect(byName.get("cn")?.dependencies).toEqual(["cn"]);
		expect(byName.get("tv")?.dependencies).toEqual(["tailwind-merge", "tailwind-variants"]);
	});

	test("installs the bottom sheet's engine from npm and its native peers through expo", () => {
		// The skin imports the engine; the engine's native peers — teleport above
		// all, a Fabric view the scan cannot see — come from `ITEM_META`.
		const sheet = byName.get("bottom-sheet");
		expect(sheet?.dependencies).toContain("@delacour/react-native-bottom-sheet");
		expect(sheet?.expoDependencies).toEqual(
			expect.arrayContaining([
				"react-native-teleport",
				"react-native-keyboard-controller",
				"react-native-safe-area-context",
				"react-native-gesture-handler",
				"react-native-reanimated",
				"react-native-worklets",
			])
		);
		expect(sheet?.dependencies).not.toContain("react-native-teleport");
		expect([...(sheet?.dependencies ?? []), ...(sheet?.expoDependencies ?? [])]).not.toContain("@gorhom/bottom-sheet");
	});

	test("never installs react or react-native — every Expo app already has them", () => {
		for (const item of registry.items) {
			expect([...item.dependencies, ...item.expoDependencies, ...item.devDependencies]).not.toContain("react");
			expect([...item.dependencies, ...item.expoDependencies, ...item.devDependencies]).not.toContain("react-native");
		}
	});

	test("ships the CSS that no import scan could have found the packages for", () => {
		const styles = byName.get("styles");
		expect(styles?.files.map((file) => file.target)).toEqual(
			expect.arrayContaining(["base.css", "index.css", "theme.css", "tokens.css", "tokens.ts", "uniwind-env.d.ts"])
		);
		expect(styles?.expoDependencies).toContain("uniwind");
		expect(styles?.dependencies).toContain("tailwindcss");
	});

	test("keeps tests out of the files a plain add copies", () => {
		for (const item of registry.items) {
			for (const file of item.files) expect(file.path).not.toMatch(/\.(test|test-helpers|fixtures)\.tsx?$/);
		}
	});

	test("ships each item's tests beside its files, under the same targets", () => {
		const button = byName.get("button");

		expect(button?.tests.map((file) => file.target)).toContain("button/button.variants.test.ts");
		expect(byName.get("cn")?.tests.map((file) => file.target)).toContain("cn.test.ts");
		expect(byName.get("styles")?.tests.map((file) => file.target)).toContain("theme-tokens.test.ts");
	});

	test("ships no library-wide suite — those check the library, not an item", () => {
		const paths = registry.items.flatMap((item) => item.tests.map((file) => file.path));

		expect(paths).not.toContain(`${PACKAGE_DIR}/src/docs.test.ts`);
		for (const path of paths) expect(path.slice(`${PACKAGE_DIR}/src/`.length)).toContain("/");
	});

	// A test lands in a project on Jest or Vitest as often as on Bun, and the
	// three share one API. Holding every suite to it is what keeps porting one
	// to another runner a change of import line rather than a rewrite.
	test("every shipped test keeps to the API Bun, Jest and Vitest share", () => {
		const offences = [...delivered]
			.filter(([path]) => isTest(path))
			.flatMap(([path, content]) => runnerSpecificUses(content).map((use) => `${path} ${use}`));

		expect(offences).toEqual([]);
	});

	test("records what only the tests need apart from what the source needs", () => {
		for (const item of registry.items) {
			for (const dependency of item.testRegistryDependencies) {
				expect(item.registryDependencies).not.toContain(dependency);
				expect(dependency).not.toBe(item.name);
			}
		}

		expect(byName.get("button")?.testDependencies).toContain("@types/bun");
		expect(byName.get("button")?.dependencies).not.toContain("@types/bun");
		expect(byName.get("button")?.devDependencies).not.toContain("@types/bun");
	});

	test("an item with no tests needs nothing for them", () => {
		const untested = registry.items.filter((item) => item.tests.length === 0);

		expect(untested.length).toBeGreaterThan(0);
		for (const item of untested) {
			expect(item.testRegistryDependencies).toEqual([]);
			expect(item.testDependencies).toEqual([]);
		}
	});

	test("leaves no import pointing outside the item it was copied with", () => {
		for (const { where, specifier } of everyImport()) {
			if (!specifier.startsWith(".")) continue;
			expect(`${where}: ${specifier}`).not.toContain("..");
		}
	});

	test("every placeholder names a namespace and an item that exists", () => {
		const names = new Set(registry.items.map((item) => item.name));

		for (const { where, specifier } of everyImport()) {
			const placeholder = parsePlaceholder(specifier);
			if (!specifier.startsWith(PLACEHOLDER_PREFIX)) continue;

			expect(`${where}: ${specifier}`).toBeDefined();
			expect(placeholder).not.toBeNull();
			expect(names.has(itemOf(placeholder?.namespace, placeholder?.moduleId))).toBe(true);
		}
	});

	test("leaves no reference to the source package in what a consumer receives", () => {
		for (const { content } of everyFile()) expect(content).not.toContain("@delacour/react-native-ui");
	});

	test("an item names the library source rather than a copy of it", () => {
		expect(byName.get("button")?.files).toContainEqual({
			path: "packages/react-native-ui/src/components/button/button.tsx",
			target: "button/button.tsx",
			namespace: "ui",
			rewrites: [
				{ from: "../icon", to: "@registry/ui/icon" },
				{ from: "../pressable", to: "@registry/ui/pressable" },
				{ from: "../spinner", to: "@registry/ui/spinner" },
				{ from: "../text/text.context", to: "@registry/ui/text/text.context" },
			],
		});

		// The whole point of the split: no component source anywhere in the JSON.
		expect(JSON.stringify(registry.items)).not.toContain("ButtonProvider");
	});

	test("every file is named once, and every name is a file in the library", () => {
		const referenced = everyFile().map(({ file }) => file.path);

		expect(new Set(referenced).size).toBe(referenced.length);
		for (const path of new Set(referenced)) expect(delivered.has(path)).toBe(true);
	});

	test("a file's path is the library source it is", () => {
		for (const { file } of everyFile()) {
			expect(file.path.startsWith(`${PACKAGE_DIR}/src/`)).toBe(true);
			expect(file.path.endsWith(basename(file.target))).toBe(true);
		}
	});

	test("the rewrites resolve every placeholder they introduce", () => {
		for (const { file } of everyFile()) {
			for (const { to } of file.rewrites) expect(parsePlaceholder(to)).not.toBeNull();
		}
	});

	test("the index carries every item without their contents", () => {
		expect(registry.index.items).toHaveLength(registry.items.length);
		expect(registry.index.items.find((entry) => entry.name === "button")?.files).toContain("ui/button/button.tsx");
		expect(JSON.stringify(registry.index)).not.toContain("ButtonProvider");
	});

	test("is deterministic — two builds of the same source are byte-identical", async () => {
		const second = await buildRegistry({ packageRoot: PACKAGE_ROOT, packageDir: PACKAGE_DIR });

		expect(JSON.stringify(second)).toBe(JSON.stringify(registry));
	});
});

/** Tests included: a copied test is held to every rule a copied component is. */
function everyFile(): { item: RegistryItem; file: RegistryFile; content: string; where: string }[] {
	return registry.items.flatMap((item) =>
		[...item.files, ...item.tests].map((file) => ({
			item,
			file,
			content: delivered.get(file.path) as string,
			where: `${item.name}/${file.target}`,
		}))
	);
}

function basename(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1);
}

function everyImport(): { where: string; specifier: string }[] {
	return everyFile()
		.filter(({ file }) => /\.tsx?$/.test(file.path) && !file.path.endsWith(".d.ts"))
		.flatMap(({ content, where }) => scanImports(content).map(({ specifier }) => ({ where, specifier })));
}

/** `("ui", "icon/icon.variants")` → `icon`; `("lib", "cn")` → `cn`. */
function itemOf(namespace: string | undefined, moduleId: string | undefined): string {
	if (namespace === "ui") return (moduleId ?? "").split("/")[0] as string;
	if (namespace === "styles" || namespace === "icons") return namespace;
	// `cn.test` is a test of `cn`.
	return (moduleId ?? "").split(".")[0] as string;
}

describe("escapingReads", () => {
	test("finds a read that climbs out of the test's own folder", () => {
		const source = 'const CSS = readFileSync(join(import.meta.dirname, "../../styles/theme.css"), "utf-8");';
		expect(escapingReads(source)).toEqual(["../../styles/theme.css"]);
	});

	test("finds it through import.meta.dir as well", () => {
		expect(escapingReads('readdirSync(join(import.meta.dir, "../components"))')).toEqual(["../components"]);
	});

	test("lets a read of a sibling through", () => {
		expect(escapingReads('readFileSync(join(import.meta.dirname, "tokens.css"), "utf-8")')).toEqual([]);
		expect(escapingReads('readFileSync(join(import.meta.dirname, "./tokens.css"), "utf-8")')).toEqual([]);
	});
});

describe("runnerSpecificUses", () => {
	test("passes the API every runner shares", () => {
		const source = [
			'import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test } from "bun:test";',
			'const CSS = readFileSync(join(import.meta.dirname, "tokens.css"), "utf-8");',
			"test.each([1, 2])('%d', (n) => expect([n]).toContain(n));",
			"expect(value).toBeCloseTo(1); expect(fn).toThrow(); expect(list).toHaveLength(2);",
		].join("\n");

		expect(runnerSpecificUses(source)).toEqual([]);
	});

	test("finds a Bun-only import from bun:test", () => {
		const source = 'import { describe, expect, mock, spyOn, test } from "bun:test";';
		expect(runnerSpecificUses(source)).toEqual(['imports "mock" from bun:test', 'imports "spyOn" from bun:test']);
	});

	test("finds the Bun global", () => {
		expect(runnerSpecificUses('await Bun.file("x").text()')).toEqual(["Bun.file"]);
	});

	test("finds import.meta beyond dirname", () => {
		expect(runnerSpecificUses("join(import.meta.dir, 'x'); new URL('x', import.meta.url)")).toEqual([
			"import.meta.dir",
			"import.meta.url",
		]);
	});

	test("finds a matcher only Bun ships", () => {
		expect(runnerSpecificUses("expect(s).toStartWith('a'); expect(n).toBeOneOf([1]);")).toEqual([
			".toStartWith(",
			".toBeOneOf(",
		]);
	});

	test("finds a modifier only some runners have", () => {
		expect(runnerSpecificUses("test.if(ok)('x', () => {}); describe.skipIf(ci)('y', () => {});")).toEqual([
			"test.if(",
			"describe.skipIf(",
		]);
	});
});
