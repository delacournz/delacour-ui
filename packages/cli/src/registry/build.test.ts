import { beforeAll, describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { type BuildResult, buildRegistry } from "./build";
import { PLACEHOLDER_PREFIX, parsePlaceholder } from "./namespaces";
import { applyRewrites } from "./rewrite";
import { scanImports } from "./scan-imports";
import type { RegistryFile, RegistryItem } from "./schema";

/**
 * Built against the real `packages/native-ui`, not a fixture.
 *
 * A fixture would only assert that the builder agrees with a copy of the
 * conventions rather than with the library itself, and the whole point of
 * deriving the registry is that the two cannot diverge.
 */
const PACKAGE_ROOT = join(import.meta.dirname, "../../../native-ui");
const PACKAGE_DIR = "packages/native-ui";
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
		for (const file of item.files) {
			const source = await readFile(join(REPO_ROOT, file.path), "utf-8");
			delivered.set(file.path, applyRewrites(source, file.rewrites));
		}
	}
});

describe("buildRegistry", () => {
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

	test("routes native modules to expo install and plain packages to the package manager", () => {
		const pressable = byName.get("pressable");
		expect(pressable?.expoDependencies).toContain("react-native-reanimated");
		expect(pressable?.expoDependencies).toContain("react-native-gesture-handler");
		expect(pressable?.dependencies).not.toContain("react-native-reanimated");

		expect(byName.get("cn")?.dependencies).toEqual(["clsx", "tailwind-merge"]);
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

	test("excludes tests", () => {
		for (const { file } of everyFile()) expect(file.path).not.toContain(".test.");
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
		for (const { content } of everyFile()) expect(content).not.toContain("delacour-react-native-ui");
	});

	test("an item names the library source rather than a copy of it", () => {
		expect(byName.get("button")?.files).toContainEqual({
			path: "packages/native-ui/src/components/button/button.tsx",
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

function everyFile(): { item: RegistryItem; file: RegistryFile; content: string; where: string }[] {
	return registry.items.flatMap((item) =>
		item.files.map((file) => ({
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
	return moduleId ?? "";
}
