import { describe, expect, test } from "bun:test";
import { adaptTest, detectTestRunner, testRunnerPackages } from "./test-runner";

const SUITE = [
	'import { describe, expect, test } from "bun:test";',
	'import { readFileSync } from "node:fs";',
	'import { join } from "node:path";',
	'import { buttonVariants } from "@/components/ui/button/button.variants";',
	"",
	'const CSS = readFileSync(join(import.meta.dirname, "tokens.css"), "utf-8");',
].join("\n");

describe("adaptTest", () => {
	test("leaves a suite alone for Bun", () => {
		expect(adaptTest(SUITE, "bun")).toBe(SUITE);
	});

	test("imports the shared API from vitest under Vitest", () => {
		const adapted = adaptTest(SUITE, "vitest");

		expect(adapted).toContain('import { describe, expect, test } from "vitest";');
		expect(adapted).not.toContain("bun:test");
		expect(adapted).toContain("import.meta.dirname");
	});

	test("imports from @jest/globals under Jest, and reads beside itself through __dirname", () => {
		const adapted = adaptTest(SUITE, "jest");

		expect(adapted).toContain('import { describe, expect, test } from "@jest/globals";');
		expect(adapted).toContain('join(__dirname, "tokens.css")');
		expect(adapted).not.toContain("bun:test");
		expect(adapted).not.toContain("import.meta");
	});

	test("touches nothing but the runner import and import.meta.dirname", () => {
		const adapted = adaptTest(SUITE, "jest");

		expect(adapted.replace("@jest/globals", "bun:test").replace("__dirname", "import.meta.dirname")).toBe(SUITE);
	});

	test("rewrites a single-quoted import too", () => {
		expect(adaptTest("import { test } from 'bun:test';", "vitest")).toBe("import { test } from 'vitest';");
	});
});

describe("detectTestRunner", () => {
	test("reads the test script first", () => {
		expect(detectTestRunner({ scripts: { test: "vitest run" }, devDependencies: { jest: "^30.0.0" } })).toBe("vitest");
		expect(detectTestRunner({ scripts: { test: "jest --watchAll" } })).toBe("jest");
		expect(detectTestRunner({ scripts: { test: "bun test" }, devDependencies: { vitest: "^3.0.0" } })).toBe("bun");
	});

	test("falls back to the runner the project depends on", () => {
		expect(detectTestRunner({ devDependencies: { vitest: "^3.0.0" } })).toBe("vitest");
		expect(detectTestRunner({ devDependencies: { "jest-expo": "~57.0.0" } })).toBe("jest");
		expect(detectTestRunner({ dependencies: { jest: "^30.0.0" } })).toBe("jest");
	});

	test("takes a top-level jest config as Jest", () => {
		expect(detectTestRunner({ jest: { preset: "jest-expo" } })).toBe("jest");
	});

	test("says nothing for a project with no runner", () => {
		expect(detectTestRunner({ scripts: { start: "expo start" }, dependencies: { expo: "~57.0.0" } })).toBeNull();
		expect(detectTestRunner({})).toBeNull();
	});
});

describe("testRunnerPackages", () => {
	test("types Bun's runner, and installs nothing else", () => {
		expect(testRunnerPackages("bun")).toEqual(["@types/bun"]);
	});

	test("asks for the import a rewritten suite names, and Node's types for node:*", () => {
		expect(testRunnerPackages("vitest")).toEqual(["@types/node", "vitest"]);
		expect(testRunnerPackages("jest")).toEqual(["@jest/globals", "@types/node"]);
	});
});
