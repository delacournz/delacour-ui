import { describe, expect, test } from "bun:test";
import { mergePackageJson, sharedTsconfig } from "./package-scaffold";

const EXPORTS = { "./button": "./src/components/ui/button/index.ts" };

describe("mergePackageJson", () => {
	test("creates a source-only package with no build step", () => {
		const result = mergePackageJson(null, { name: "@acme/ui", exports: EXPORTS, peers: [] });

		expect(result.name).toBe("@acme/ui");
		expect(result.type).toBe("module");
		expect(result.private).toBe(true);
		// The package ships raw .tsx — Uniwind's transform has to run in the
		// consuming app's Metro pipeline, so there is nothing to build.
		expect(result.main).toBeUndefined();
		expect(result.types).toBeUndefined();
	});

	test("exports each component, and never a root barrel", () => {
		const result = mergePackageJson(null, { name: "@acme/ui", exports: EXPORTS, peers: [] });

		expect(result.exports?.["./button"]).toBe("./src/components/ui/button/index.ts");
		expect(result.exports?.["."]).toBeUndefined();
	});

	test("records native modules as peers, never dependencies", () => {
		const result = mergePackageJson(null, {
			name: "@acme/ui",
			exports: EXPORTS,
			peers: ["react-native-reanimated", "clsx"],
		});

		expect(result.peerDependencies?.["react-native-reanimated"]).toBe("*");
		expect(result.peerDependencies?.clsx).toBe("*");
		expect(result.dependencies).toBeUndefined();
	});

	test("keeps a name the user already chose", () => {
		const existing = { name: "@theirs/design-system", version: "2.1.0", private: true };
		const result = mergePackageJson(existing, { name: "@acme/ui", exports: EXPORTS, peers: [] });

		expect(result.name).toBe("@theirs/design-system");
		expect(result.version).toBe("2.1.0");
	});

	test("leaves fields it does not own alone", () => {
		const existing = { name: "@theirs/ui", scripts: { lint: "biome check ." }, sideEffects: false };
		const result = mergePackageJson(existing, { name: "@acme/ui", exports: EXPORTS, peers: [] });

		expect(result.scripts).toEqual({ lint: "biome check ." });
		expect(result.sideEffects).toBe(false);
	});

	test("replaces the exports map rather than merging it, so a removed component leaves", () => {
		const existing = { name: "@acme/ui", exports: { "./gone": "./src/gone/index.ts" } };
		const result = mergePackageJson(existing, { name: "@acme/ui", exports: EXPORTS, peers: [] });

		expect(result.exports).toEqual(EXPORTS);
	});

	test("keeps a peer the user pinned, rather than loosening it to *", () => {
		const existing = { name: "@acme/ui", peerDependencies: { "react-native-reanimated": "~4.5.0" } };
		const result = mergePackageJson(existing, {
			name: "@acme/ui",
			exports: EXPORTS,
			peers: ["react-native-reanimated", "clsx"],
		});

		expect(result.peerDependencies?.["react-native-reanimated"]).toBe("~4.5.0");
		expect(result.peerDependencies?.clsx).toBe("*");
	});
});

describe("sharedTsconfig", () => {
	test("is a checking-only config, since the package has no build", () => {
		const config = sharedTsconfig();

		expect(config.compilerOptions.noEmit).toBe(true);
		expect(config.include).toContain("src");
	});
});
