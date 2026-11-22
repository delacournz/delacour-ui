import { describe, expect, test } from "bun:test";
import { type JestReport, parseShard, partition, timingsFrom, verifyRun } from "./test-shards";

const files = ["a.test.tsx", "b.test.tsx", "c.test.tsx", "d.test.tsx", "e.test.tsx"];

const suite = (name: string, status: "passed" | "failed" = "passed", ms = 100): JestReport["testResults"][number] => ({
	name: `/repo/pkg/${name}`,
	status,
	message: status === "failed" ? "boom" : "",
	perfStats: { start: 1000, end: 1000 + ms },
	assertionResults: [{ status }],
});

const report = (suites: JestReport["testResults"], extra: Partial<JestReport> = {}): JestReport => ({
	success: suites.every((s) => s.status === "passed"),
	numFailedTestSuites: suites.filter((s) => s.status === "failed").length,
	numRuntimeErrorTestSuites: 0,
	numPendingTests: 0,
	numTodoTests: 0,
	numTotalTestSuites: suites.length,
	testResults: suites,
	...extra,
});

describe("parseShard", () => {
	test("reads i/N", () => {
		expect(parseShard("2/5")).toEqual({ success: true, data: { index: 2, total: 5 } });
	});

	test.each(["0/5", "6/5", "x", "1/0", "1.5/3", ""])("refuses %p", (value) => {
		expect(parseShard(value).success).toBe(false);
	});
});

describe("partition", () => {
	test("puts every file in exactly one shard", () => {
		const shards = partition(files, {}, 3);
		expect(shards).toHaveLength(3);
		expect(shards.flat().sort()).toEqual([...files].sort());
	});

	test("is deterministic whatever order the files arrive in", () => {
		const timings = { "a.test.tsx": 5, "b.test.tsx": 3, "c.test.tsx": 3, "d.test.tsx": 1, "e.test.tsx": 8 };
		expect(partition([...files].reverse(), timings, 2)).toEqual(partition(files, timings, 2));
	});

	test("balances by recorded time, longest first", () => {
		const timings = { "a.test.tsx": 10, "b.test.tsx": 6, "c.test.tsx": 5, "d.test.tsx": 4, "e.test.tsx": 1 };
		const shards = partition(files, timings, 2);
		const load = shards.map((shard) =>
			shard.reduce((sum, file) => sum + (timings[file as keyof typeof timings] ?? 0), 0)
		);
		expect(load.sort()).toEqual([12, 14]);
	});

	test("stays within LPT's 4/3 bound of a perfect split on a realistic spread", () => {
		const many = Array.from({ length: 109 }, (_, i) => `f${i}.test.tsx`);
		const timings = Object.fromEntries(many.map((file, i) => [file, 500 + ((i * 7919) % 9000)]));
		const total = Object.values(timings).reduce((a, b) => a + b, 0);
		const shards = partition(many, timings, 6);
		const worst = Math.max(...shards.map((shard) => shard.reduce((sum, file) => sum + (timings[file] ?? 0), 0)));
		expect(worst).toBeLessThanOrEqual((total / 6) * (4 / 3));
		expect(worst).toBeLessThanOrEqual((total / 6) * 1.05);
	});

	test("gives a file with no recorded time the median, so a new file is not free", () => {
		const timings = { "a.test.tsx": 10, "b.test.tsx": 10, "c.test.tsx": 10, "d.test.tsx": 10 };
		const shards = partition(files, timings, 5);
		expect(shards.every((shard) => shard.length === 1)).toBe(true);
	});

	test("leaves a shard empty rather than splitting a file", () => {
		const shards = partition(["a.test.tsx"], {}, 3);
		expect(shards.flat()).toEqual(["a.test.tsx"]);
	});
});

describe("verifyRun", () => {
	const assigned = ["pkg/a.test.tsx", "pkg/b.test.tsx"];

	test("passes when Jest ran exactly the assigned files and every one passed", () => {
		expect(verifyRun(assigned, report([suite("a.test.tsx"), suite("b.test.tsx")]), "/repo")).toEqual({
			success: true,
			data: 2,
		});
	});

	test("names a file the shard was given and Jest never ran", () => {
		const result = verifyRun(assigned, report([suite("a.test.tsx")]), "/repo");
		expect(result.success).toBe(false);
		expect(result.success ? "" : result.error).toContain("not run: pkg/b.test.tsx");
	});

	test("names a file Jest ran that the shard was not given", () => {
		const result = verifyRun(
			assigned,
			report([suite("a.test.tsx"), suite("b.test.tsx"), suite("c.test.tsx")]),
			"/repo"
		);
		expect(result.success ? "" : result.error).toContain("not assigned: pkg/c.test.tsx");
	});

	test("lists every failed suite, not just the first", () => {
		const result = verifyRun(assigned, report([suite("a.test.tsx", "failed"), suite("b.test.tsx", "failed")]), "/repo");
		const error = result.success ? "" : result.error;
		expect(error).toContain("failed: pkg/a.test.tsx");
		expect(error).toContain("failed: pkg/b.test.tsx");
	});

	test("refuses a skipped or todo test: nothing is hidden", () => {
		const result = verifyRun(
			assigned,
			report([suite("a.test.tsx"), suite("b.test.tsx")], { numPendingTests: 1, numTodoTests: 2 }),
			"/repo"
		);
		const error = result.success ? "" : result.error;
		expect(error).toContain("1 skipped");
		expect(error).toContain("2 todo");
	});

	test("refuses a suite that crashed before it ran a test", () => {
		const result = verifyRun(
			assigned,
			report([suite("a.test.tsx"), suite("b.test.tsx")], { numRuntimeErrorTestSuites: 1 }),
			"/repo"
		);
		expect(result.success ? "" : result.error).toContain("1 suite(s) crashed");
	});

	test("refuses a suite with no assertions run", () => {
		const empty = { ...suite("b.test.tsx"), assertionResults: [] };
		const result = verifyRun(assigned, report([suite("a.test.tsx"), empty]), "/repo");
		expect(result.success ? "" : result.error).toContain("ran no tests: pkg/b.test.tsx");
	});
});

describe("timingsFrom", () => {
	test("records each suite's wall time against its repo-relative path", () => {
		expect(
			timingsFrom(report([suite("a.test.tsx", "passed", 1500), suite("b.test.tsx", "passed", 300)]), "/repo")
		).toEqual({
			"pkg/a.test.tsx": 1500,
			"pkg/b.test.tsx": 300,
		});
	});
});
