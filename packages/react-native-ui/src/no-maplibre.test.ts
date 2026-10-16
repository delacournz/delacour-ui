import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SRC = import.meta.dirname;

/** The one folder allowed to import the native map module. */
const MAP_FOLDER = join(SRC, "components", "map") + sep;

/** An import or re-export of MapLibre, static or dynamic, the package or any path inside it. */
const MAPS_IMPORT = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']@maplibre\/[^"']+["']/;

/** An import that reaches into the map folder from outside it. */
const MAP_FOLDER_IMPORT = /from\s+["'](?:\.\.\/)+(?:components\/)?map(?:\/[^"']*)?["']/;

/**
 * `@maplibre/maplibre-react-native` stays behind `@delacour/react-native-ui/map`.
 *
 * It is an **optional** peer: an app that never imports the map never installs
 * it, and the granular exports are what make that safe — but only for as long
 * as no other component's import graph reaches it. One stray import from a
 * shared helper and every app using that helper fails to bundle with "Unable
 * to resolve module @maplibre/maplibre-react-native", for a map it never drew. The same
 * holds for an import of the map folder itself, which would pull the module in
 * transitively.
 *
 * Read as text, importing nothing, like `docs.test.ts` — `bun test` cannot
 * parse React Native's Flow-typed source, and it does not need to.
 */
function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [path] : [];
	});
}

const FILES = sourceFiles(SRC);
const OUTSIDE = FILES.filter((path) => !path.startsWith(MAP_FOLDER));

describe("MapLibre stays inside the map folder", () => {
	// An empty walk would let the assertions below pass on nothing.
	test("finds the source tree, and the map folder in it", () => {
		expect(OUTSIDE.length).toBeGreaterThan(50);
		expect(FILES.some((path) => path.startsWith(MAP_FOLDER) && MAPS_IMPORT.test(readFileSync(path, "utf-8")))).toBe(
			true
		);
	});

	test("no file outside it imports the native module", () => {
		const offenders = OUTSIDE.filter((path) => MAPS_IMPORT.test(readFileSync(path, "utf-8"))).map((path) =>
			relative(SRC, path)
		);
		expect(offenders).toEqual([]);
	});

	test("no file outside it imports the map folder", () => {
		const offenders = OUTSIDE.filter((path) => MAP_FOLDER_IMPORT.test(readFileSync(path, "utf-8"))).map((path) =>
			relative(SRC, path)
		);
		expect(offenders).toEqual([]);
	});

	test("it is an optional peer of the package", () => {
		const pkg = JSON.parse(readFileSync(join(SRC, "..", "package.json"), "utf-8")) as {
			dependencies?: Record<string, string>;
			peerDependencies?: Record<string, string>;
			peerDependenciesMeta?: Record<string, { optional?: boolean }>;
		};
		expect(pkg.dependencies?.["@maplibre/maplibre-react-native"]).toBeUndefined();
		expect(pkg.peerDependencies?.["@maplibre/maplibre-react-native"]).toBeDefined();
		expect(pkg.peerDependenciesMeta?.["@maplibre/maplibre-react-native"]?.optional).toBe(true);
	});
});
