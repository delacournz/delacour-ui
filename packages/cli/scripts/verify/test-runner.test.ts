import { describe, expect, test } from "bun:test";
import { parseBunSummary, parseJsonReport, runnerManifest, vitestConfig } from "./test-runner";

describe("parseJsonReport", () => {
	test("reads Jest's and Vitest's shared --json shape, counting files rather than describe blocks", () => {
		const report = JSON.stringify({
			numTotalTestSuites: 12,
			numFailedTestSuites: 1,
			numTotalTests: 10,
			numFailedTests: 2,
			testResults: [
				{ name: "/app/src/a.test.ts", status: "passed", message: "" },
				{ name: "/app/src/b.test.ts", status: "failed", message: "Expected 1\nReceived 2" },
				{ name: "/app/src/c.test.ts", status: "passed", message: "" },
			],
		});

		expect(parseJsonReport(report)).toEqual({
			files: 3,
			tests: 10,
			failed: 2,
			failures: ["/app/src/b.test.ts: Expected 1"],
		});
	});

	test("counts a suite that failed to load as a failure even with no failed test", () => {
		const report = JSON.stringify({
			numTotalTestSuites: 1,
			numFailedTestSuites: 1,
			numTotalTests: 0,
			numFailedTests: 0,
			testResults: [{ name: "/app/src/a.test.ts", status: "failed", message: "Must use import to load ES Module" }],
		});

		expect(parseJsonReport(report).failed).toBe(1);
	});
});

describe("parseBunSummary", () => {
	test("reads the totals bun test prints last", () => {
		const output = " 7279 pass\n 0 fail\n 215254 expect() calls\nRan 7279 tests across 163 files. [1.29s]\n";
		expect(parseBunSummary(output)).toEqual({ files: 163, tests: 7279, failed: 0, failures: [] });
	});

	test("names the failing tests", () => {
		const output = "(fail) planner > follows the clock [0.2ms]\n 1 pass\n 1 fail\nRan 2 tests across 1 file. [4ms]\n";
		expect(parseBunSummary(output)).toEqual({
			files: 1,
			tests: 2,
			failed: 1,
			failures: ["(fail) planner > follows the clock [0.2ms]"],
		});
	});

	test("throws on output with no summary, rather than reading it as zero", () => {
		expect(() => parseBunSummary("error: something else\n")).toThrow();
	});
});

describe("runnerManifest", () => {
	test("Jest runs through jest-expo at the app's SDK, and lets the engines through", () => {
		const manifest = runnerManifest("jest", "~58.0.16");

		expect(manifest.scripts.test).toBe("jest");
		expect(manifest.devDependencies["jest-expo"]).toBe("~58.0.0");
		expect(JSON.stringify(manifest.jest)).toContain("@delacour/.*|d3-.*|internmap");
	});

	test("Vitest runs once, with nothing but itself installed", () => {
		const manifest = runnerManifest("vitest", "~58.0.16");

		expect(manifest.scripts.test).toBe("vitest run");
		expect(Object.keys(manifest.devDependencies)).toEqual(["vitest"]);
	});

	test("Bun needs nothing installed", () => {
		expect(runnerManifest("bun", "~58.0.16")).toEqual({ scripts: { test: "bun test" }, devDependencies: {} });
	});
});

describe("vitestConfig", () => {
	test("maps each wildcard tsconfig path to an alias beside the config", () => {
		const config = vitestConfig({ "@/*": ["./src/*"], exact: ["./x.ts"] });

		expect(config).toContain('{ find: "@/", replacement: `${resolve(import.meta.dirname, "./src")}/` }');
		expect(config).not.toContain("exact");
	});

	test("keeps Vite from reading a tsconfig whose extends it cannot resolve", () => {
		expect(vitestConfig({})).toContain('esbuild: { tsconfigRaw: "{}" }');
	});
});
