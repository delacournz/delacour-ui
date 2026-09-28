import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = import.meta.dirname;
const PACKAGE_JSON = join(SRC, "..", "package.json");

/** The sheet library `BottomSheet` used to wrap. */
const FORBIDDEN = "@gorhom/";

/**
 * Nothing in this package names the sheet library it used to wrap.
 *
 * `BottomSheet` is built on `@delacour/react-native-bottom-sheet` now, and the
 * old library left as a peer with it. A stray import would make every consumer
 * install a package nobody uses; a stray mention in a doc would send a reader
 * to a workaround that no longer applies. Both read the same to `grep`, so this
 * reads the whole tree as text, source and docs alike.
 *
 * Like `docs.test.ts`, this imports nothing from the tree — `bun test` cannot
 * parse React Native's Flow-typed source, and it does not need to.
 */
function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return /\.(tsx?|md|css)$/.test(entry.name) && entry.name !== "no-gorhom.test.ts" ? [path] : [];
	});
}

const FILES = sourceFiles(SRC);

describe("no gorhom", () => {
	// An empty walk would let the assertion below pass on nothing.
	test("finds the source tree", () => {
		expect(FILES.length).toBeGreaterThan(50);
	});

	test("no source file or doc mentions the old sheet library", () => {
		const offenders = FILES.filter((path) => readFileSync(path, "utf-8").includes(FORBIDDEN)).map((path) =>
			relative(SRC, path)
		);
		expect(offenders).toEqual([]);
	});

	test("it is not a dependency or peer of the package", () => {
		const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf-8")) as Record<string, Record<string, string> | undefined>;
		const declared = ["dependencies", "peerDependencies", "devDependencies", "optionalDependencies"].flatMap((field) =>
			Object.keys(pkg[field] ?? {})
		);
		expect(declared.filter((name) => name.startsWith(FORBIDDEN))).toEqual([]);
		expect(Object.keys(pkg.peerDependenciesMeta ?? {}).filter((name) => name.startsWith(FORBIDDEN))).toEqual([]);
	});
});
