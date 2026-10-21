import { describe, expect, test } from "bun:test";
import { checkTestRunner, type TestSetup } from "./test-setup";

const JEST_EXPO = '{ "preset": "jest-expo" }';
const VITEST_CONFIG = [
	'import { defineConfig } from "vitest/config";',
	"export default defineConfig({",
	'\tesbuild: { tsconfigRaw: "{}" },',
	'\tresolve: { alias: [{ find: "@/", replacement: "./src/" }] },',
	"});",
].join("\n");

function setup(overrides: Partial<TestSetup>): TestSetup {
	return {
		runner: "bun",
		scripted: null,
		copiedTests: 3,
		dependencies: {},
		jestConfig: null,
		vitestConfig: null,
		tsconfigExtends: null,
		aliasPrefixes: ["@/"],
		...overrides,
	};
}

describe("checkTestRunner", () => {
	test("has nothing to say with no copied tests", () => {
		expect(checkTestRunner(setup({ copiedTests: 0 })).status).toBe("skip");
	});

	test("passes Bun with its types installed", () => {
		expect(checkTestRunner(setup({ dependencies: { "@types/bun": "^1.3.0" } })).status).toBe("pass");
	});

	test("names a package the copied tests import and nobody installed", () => {
		const check = checkTestRunner(setup({ runner: "jest", jestConfig: JEST_EXPO, dependencies: { jest: "^30.0.0" } }));

		expect(check.status).toBe("warn");
		expect(check.detail).toContain("@jest/globals");
		expect(check.fix).toContain("@jest/globals");
	});

	test("says when the test script runs a different runner from the one the tests were written for", () => {
		const check = checkTestRunner(
			setup({ runner: "jest", scripted: "vitest", jestConfig: JEST_EXPO, dependencies: JEST_PACKAGES })
		);

		expect(check.status).toBe("warn");
		expect(check.detail).toContain("vitest");
		expect(check.fix).toContain("tests.runner");
	});

	describe("Jest", () => {
		test("passes on jest-expo with everything installed", () => {
			expect(
				checkTestRunner(setup({ runner: "jest", jestConfig: JEST_EXPO, dependencies: JEST_PACKAGES })).status
			).toBe("pass");
		});

		test("wants Jest itself installed", () => {
			const { jest: _, ...rest } = JEST_PACKAGES;
			const check = checkTestRunner(setup({ runner: "jest", jestConfig: JEST_EXPO, dependencies: rest }));

			expect(check.status).toBe("warn");
			expect(check.detail).toContain("jest");
		});

		test("wants a config, since bare Jest compiles neither TypeScript nor React Native", () => {
			const check = checkTestRunner(setup({ runner: "jest", dependencies: JEST_PACKAGES }));

			expect(check.status).toBe("warn");
			expect(check.fix).toContain("jest-expo");
		});

		test("without jest-expo, wants the alias mapped", () => {
			const babel = '{ "transform": { "^.+\\\\.tsx?$": "babel-jest" } }';
			const unmapped = checkTestRunner(setup({ runner: "jest", jestConfig: babel, dependencies: JEST_PACKAGES }));
			const mapped = checkTestRunner(
				setup({
					runner: "jest",
					jestConfig: `{ "preset": "react-native", "moduleNameMapper": { "^@/(.*)$": "<rootDir>/src/$1" } }`,
					dependencies: JEST_PACKAGES,
				})
			);

			expect(unmapped.status).toBe("warn");
			expect(unmapped.detail).toContain("@/");
			expect(mapped.status).toBe("pass");
		});
	});

	describe("Vitest", () => {
		test("passes on a config that maps the alias and keeps Vite off Expo's tsconfig", () => {
			const check = checkTestRunner(
				setup({
					runner: "vitest",
					vitestConfig: VITEST_CONFIG,
					tsconfigExtends: "expo/tsconfig.base",
					dependencies: VITEST_PACKAGES,
				})
			);

			expect(check.status).toBe("pass");
		});

		test("wants a config when the components import through an alias", () => {
			const check = checkTestRunner(setup({ runner: "vitest", dependencies: VITEST_PACKAGES }));

			expect(check.status).toBe("warn");
			expect(check.detail).toContain("@/");
			expect(check.fix).toContain("vitest.config.ts");
		});

		test("needs no config with no alias and no Expo tsconfig to trip over", () => {
			expect(
				checkTestRunner(setup({ runner: "vitest", aliasPrefixes: [], dependencies: VITEST_PACKAGES })).status
			).toBe("pass");
		});

		test("accepts vite-tsconfig-paths in place of a hand-written alias", () => {
			const plugin = 'import tsconfigPaths from "vite-tsconfig-paths";\nexport default { plugins: [tsconfigPaths()] };';
			expect(
				checkTestRunner(setup({ runner: "vitest", vitestConfig: plugin, dependencies: VITEST_PACKAGES })).status
			).toBe("pass");
		});

		test("wants tsconfigRaw when the tsconfig extends Expo's", () => {
			const config = VITEST_CONFIG.replace('\tesbuild: { tsconfigRaw: "{}" },\n', "");
			const check = checkTestRunner(
				setup({
					runner: "vitest",
					vitestConfig: config,
					tsconfigExtends: "expo/tsconfig.base",
					dependencies: VITEST_PACKAGES,
				})
			);

			expect(check.status).toBe("warn");
			expect(check.fix).toContain("tsconfigRaw");
		});

		test("lists every problem at once", () => {
			const check = checkTestRunner(
				setup({ runner: "vitest", tsconfigExtends: "expo/tsconfig.base", dependencies: { "@types/node": "^24.0.0" } })
			);

			expect(check.detail).toContain("vitest is not installed");
			expect(check.detail).toContain("@/");
			expect(check.detail).toContain("expo/tsconfig.base");
		});
	});
});

const JEST_PACKAGES = { jest: "^30.0.0", "jest-expo": "~58.0.0", "@jest/globals": "^30.0.0", "@types/node": "^24.0.0" };
const VITEST_PACKAGES = { vitest: "^3.2.4", "@types/node": "^24.0.0" };
