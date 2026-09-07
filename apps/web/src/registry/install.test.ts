import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { COMPONENTS } from "../lib/components";

/**
 * The generated install manifest names files that exist, and covers every
 * component.
 *
 * `src/registry/install.ts` is derived from `registry/r/*.json`, which is
 * derived from `packages/native-ui/src`. Two links in that chain can rot without
 * anything failing: a file renamed in the library leaves the manifest pointing at
 * a GitHub URL that 404s, and a component added to `COMPONENTS` without a
 * regenerate leaves `<ComponentInstall>` throwing at render for a reader.
 *
 * Read as **text**, not imported — the manifest is generated, and a suite that
 * imported it would fail for a missing module rather than for the thing it is
 * actually checking. Same move as `previews/previews.test.ts`.
 */

const WEB = join(import.meta.dirname, "..", "..");
const ROOT = join(WEB, "..", "..");
const MANIFEST = join(import.meta.dirname, "install.ts");
const CONTENT = join(WEB, "content");

function manifest(): string {
	return existsSync(MANIFEST) ? readFileSync(MANIFEST, "utf-8") : "";
}

/** The top-level keys of `install` — one per component. */
function names(): string[] {
	return [...manifest().matchAll(/^\t"([^"]+)": \{$/gm)].map(([, name]) => name as string);
}

/** Every `source:` in the manifest, repo-relative. */
function sources(): string[] {
	return [...new Set([...manifest().matchAll(/source: "([^"]+)"/g)].map(([, path]) => path as string))];
}

/** Every `<ComponentInstall name="…" />` in the content tree, with its file. */
function references(): { file: string; name: string }[] {
	const found: { file: string; name: string }[] = [];
	const walk = (dir: string): void => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) walk(path);
			else if (entry.name.endsWith(".mdx")) {
				const source = readFileSync(path, "utf-8");
				for (const [, name] of source.matchAll(/<ComponentInstall\s+name="([^"]+)"/g)) {
					found.push({ file: relative(WEB, path), name: name as string });
				}
			}
		}
	};
	walk(CONTENT);
	return found;
}

const NAMES = names();
const SOURCES = sources();

describe("install manifest", () => {
	// A reader that found nothing would let every assertion below pass on an
	// empty set, so the suite would stay green while the manifest was missing.
	test("finds the manifest", () => {
		expect(NAMES.length).toBeGreaterThan(15);
		expect(SOURCES.length).toBeGreaterThan(100);
	});

	test("every component has an entry", () => {
		const missing = COMPONENTS.filter((component) => !NAMES.includes(component.slug)).map((c) => c.slug);
		expect(missing).toEqual([]);
	});

	test("the manifest names no component that does not exist", () => {
		const slugs = COMPONENTS.map((component) => component.slug);
		expect(NAMES.filter((name) => !slugs.includes(name))).toEqual([]);
	});

	// This is the assertion that keeps the Manual tab's GitHub links alive.
	test("every source file exists", () => {
		expect(SOURCES.filter((path) => !existsSync(join(ROOT, path)))).toEqual([]);
	});

	test("every source path is inside the library", () => {
		expect(SOURCES.filter((path) => !path.startsWith("packages/native-ui/src/"))).toEqual([]);
	});

	test("every <ComponentInstall> in the content names an entry that exists", () => {
		const unknown = references()
			.filter((reference) => !NAMES.includes(reference.name))
			.map((reference) => `${reference.file} → ${reference.name}`);
		expect(unknown).toEqual([]);
	});
});

/**
 * The library's peer list on the Installation page is derived, not typed.
 *
 * Three copies of that list used to exist — the README, `installation.mdx` and
 * `package.json` — and they disagreed: `expo-linear-gradient`, which `Screen`
 * needs, was in none of the two a reader sees. The manifest now exports `peers`,
 * the union of every component's closure, and this pins it to the package.
 */

const NATIVE_UI_PACKAGE = join(ROOT, "packages", "native-ui", "package.json");
const INSTALLATION_PAGE = join(CONTENT, "docs", "native", "getting-started", "installation.mdx");

/** The names `react`/`react-native` are ambient and never installed; charts is documented on its own site. */
const NEVER_LISTED = new Set(["react", "react-native", "delacour-react-native-charts"]);

function peerDependencies(): { required: string[]; optional: string[] } {
	const json = JSON.parse(readFileSync(NATIVE_UI_PACKAGE, "utf-8")) as {
		peerDependencies?: Record<string, string>;
		peerDependenciesMeta?: Record<string, { optional?: boolean }>;
	};
	const all = Object.keys(json.peerDependencies ?? {}).filter((name) => !NEVER_LISTED.has(name));
	const optional = all.filter((name) => json.peerDependenciesMeta?.[name]?.optional === true);
	return { required: all.filter((name) => !optional.includes(name)), optional };
}

/** The `peers` export, read as text. */
function peers(): { expo: string[]; npm: string[] } {
	const block = manifest().match(/export const peers = \{([\s\S]*?)\} as const/)?.[1] ?? "";
	const pick = (key: "expo" | "npm"): string[] =>
		[...(block.match(new RegExp(`${key}: \\[([^\\]]*)\\]`))?.[1] ?? "").matchAll(/"([^"]+)"/g)].map(
			([, name]) => name as string
		);
	return { expo: pick("expo"), npm: pick("npm") };
}

describe("library peers", () => {
	const { required, optional } = peerDependencies();
	const derived = [...peers().expo, ...peers().npm];

	test("the manifest exports them", () => {
		expect(derived.length).toBeGreaterThan(5);
	});

	test("every required peer is derived from some component", () => {
		expect(required.filter((name) => !derived.includes(name))).toEqual([]);
	});

	test("nothing derived is outside the package's peer list", () => {
		expect(derived.filter((name) => !required.includes(name) && !optional.includes(name))).toEqual([]);
	});

	test("the Installation page names every optional peer", () => {
		const page = existsSync(INSTALLATION_PAGE) ? readFileSync(INSTALLATION_PAGE, "utf-8") : "";
		expect(optional.filter((name) => !page.includes(`\`${name}\``))).toEqual([]);
	});
});
