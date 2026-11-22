/**
 * Runs one shard of `@delacour/react-native-ui`'s Jest render suites, and proves it ran what it was given.
 *
 * Every shard computes the same partition from the same two inputs — the files `jest --listTests`
 * reports on this tree, and the per-file times `develop` recorded on its last full run — so the
 * shards need no coordinator, and no job waits on another. The proof that the shards together ran
 * every file is two halves, each checked where it can be:
 *
 * 1. The partition covers every listed file exactly once. Checked by every shard before it runs,
 *    over the whole partition, not just its own slice.
 * 2. Each shard ran exactly its slice, every suite passed, and nothing was skipped. Checked against
 *    Jest's own JSON report, not its exit code.
 *
 * Usage (from the repo root):
 *
 *   bun scripts/test-shards.ts run --shard 2/4 [--timings t.json] [--record out.json] [-- <jest args>]
 *   bun scripts/test-shards.ts merge out.json shard-1.json shard-2.json …
 *
 * Balancing is longest-processing-time-first over the recorded times. A file with no recorded time
 * (new on this branch) weighs the median, so it is never treated as free. With no timings at all the
 * partition is still complete, only less even.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { err, ok, type Result } from "@delacour/types";

/** Shard `index` (1-based) of `total`. */
export type Shard = { index: number; total: number };

/** The parts of `jest --json` this reads. */
export type JestReport = {
	success: boolean;
	numFailedTestSuites: number;
	numRuntimeErrorTestSuites: number;
	numPendingTests: number;
	numTodoTests: number;
	numTotalTestSuites: number;
	testResults: {
		name: string;
		status: "passed" | "failed";
		message: string;
		perfStats: { start: number; end: number };
		assertionResults: { status: string }[];
	}[];
};

/** Repo-relative test path → milliseconds. */
export type Timings = Record<string, number>;

const SHARD = /^(\d+)\/(\d+)$/;

export function parseShard(value: string): Result<Shard> {
	const match = SHARD.exec(value);
	const index = Number(match?.[1]);
	const total = Number(match?.[2]);
	if (!match || total < 1 || index < 1 || index > total)
		return err(`--shard must be i/N with 1 ≤ i ≤ N, got '${value}'`);
	return ok({ index, total });
}

const median = (values: number[]): number => {
	if (values.length === 0) return 1;
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)] ?? 1;
};

/** Longest-first greedy split of `files` into `total` shards. Deterministic for a given input set. */
export function partition(files: readonly string[], timings: Timings, total: number): string[][] {
	const fallback = median(files.flatMap((file) => (timings[file] === undefined ? [] : [timings[file]])));
	const weighed = [...new Set(files)]
		.map((file) => ({ file, ms: timings[file] ?? fallback }))
		.sort((a, b) => b.ms - a.ms || a.file.localeCompare(b.file));
	const shards = Array.from({ length: total }, () => ({ files: [] as string[], ms: 0 }));
	for (const { file, ms } of weighed) {
		const lightest = shards.reduce((best, shard, i) => (shard.ms < (shards[best]?.ms ?? 0) ? i : best), 0);
		const target = shards[lightest];
		if (!target) continue;
		target.files.push(file);
		target.ms += ms;
	}
	return shards.map((shard) => shard.files.sort());
}

/** Every listed file in exactly one shard, and nothing else. */
export function verifyPartition(files: readonly string[], shards: readonly string[][]): Result<number> {
	const seen = new Map<string, number>();
	for (const file of shards.flat()) seen.set(file, (seen.get(file) ?? 0) + 1);
	const problems = [
		...files.filter((file) => !seen.has(file)).map((file) => `unassigned: ${file}`),
		...[...seen].filter(([, n]) => n > 1).map(([file, n]) => `assigned ${n} times: ${file}`),
		...[...seen.keys()].filter((file) => !files.includes(file)).map((file) => `not a listed test: ${file}`),
	];
	return problems.length === 0 ? ok(files.length) : err(problems.join("\n"));
}

/** Jest ran exactly `assigned`, every suite passed with at least one test, and nothing was skipped. */
export function verifyRun(assigned: readonly string[], report: JestReport, root: string): Result<number> {
	const ran = new Map(report.testResults.map((suite) => [relative(root, suite.name), suite]));
	const problems = [
		...assigned.filter((file) => !ran.has(file)).map((file) => `not run: ${file}`),
		...[...ran.keys()].filter((file) => !assigned.includes(file)).map((file) => `not assigned: ${file}`),
		...[...ran].filter(([, suite]) => suite.status !== "passed").map(([file]) => `failed: ${file}`),
		...[...ran].filter(([, suite]) => suite.assertionResults.length === 0).map(([file]) => `ran no tests: ${file}`),
	];
	if (report.numRuntimeErrorTestSuites > 0) problems.push(`${report.numRuntimeErrorTestSuites} suite(s) crashed`);
	if (report.numPendingTests > 0) problems.push(`${report.numPendingTests} skipped`);
	if (report.numTodoTests > 0) problems.push(`${report.numTodoTests} todo`);
	return problems.length === 0 ? ok(assigned.length) : err(problems.join("\n"));
}

export function timingsFrom(report: JestReport, root: string): Timings {
	return Object.fromEntries(
		report.testResults.map((suite) => [relative(root, suite.name), suite.perfStats.end - suite.perfStats.start])
	);
}

const ROOT = resolve(import.meta.dir, "..");
const PACKAGE = join(ROOT, "packages/react-native-ui");

function readTimings(path: string | undefined): Timings {
	if (!path || !existsSync(path)) return {};
	const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
	if (typeof parsed !== "object" || parsed === null) return {};
	return Object.fromEntries(
		Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === "number")
	);
}

function listTests(): string[] {
	const listed = spawnSync("bunx", ["jest", "--listTests"], { cwd: PACKAGE, encoding: "utf8" });
	if (listed.status !== 0) throw new Error(`jest --listTests failed:\n${listed.stderr}`);
	return listed.stdout
		.split("\n")
		.filter(Boolean)
		.map((file) => relative(ROOT, file))
		.sort();
}

function flag(args: string[], name: string): string | undefined {
	const at = args.indexOf(name);
	return at === -1 ? undefined : args[at + 1];
}

function run(all: string[]): number {
	const split = all.indexOf("--");
	const args = split === -1 ? all : all.slice(0, split);
	const passthrough = split === -1 ? [] : all.slice(split + 1);
	const shard = parseShard(flag(args, "--shard") ?? "1/1");
	if (!shard.success) return fail(shard.error);
	const { index, total } = shard.data;
	const files = listTests();
	const shards = partition(files, readTimings(flag(args, "--timings")), total);
	const covered = verifyPartition(files, shards);
	if (!covered.success) return fail(`the partition does not cover the suite:\n${covered.error}`);
	const mine = shards[index - 1] ?? [];
	console.log(
		`→ shard ${index}/${total}: ${mine.length} of ${covered.data} files (partition covers all ${covered.data})`
	);
	if (mine.length === 0) return 0;

	const report = join(mkdtempSync(join(tmpdir(), "render-shard-")), "report.json");
	const workers = String(availableParallelism());
	const jest = spawnSync(
		"bunx",
		[
			"jest",
			"--ci",
			"--randomize",
			`--maxWorkers=${workers}`,
			"--json",
			`--outputFile=${report}`,
			...passthrough,
			"--runTestsByPath",
			...mine.map((file) => join(ROOT, file)),
		],
		{ cwd: PACKAGE, stdio: "inherit" }
	);
	if (!existsSync(report)) return fail(`jest wrote no report (exit ${jest.status})`);
	const parsed: JestReport = JSON.parse(readFileSync(report, "utf8"));
	const verified = verifyRun(mine, parsed, ROOT);
	const record = flag(args, "--record");
	if (record) writeFileSync(record, `${JSON.stringify(timingsFrom(parsed, ROOT), null, "\t")}\n`);
	if (!verified.success) return fail(`shard ${index}/${total} did not run what it was given:\n${verified.error}`);
	console.log(
		`✓ shard ${index}/${total}: ran and passed exactly its ${verified.data} files, nothing skipped (${workers} workers)`
	);
	return jest.status ?? 1;
}

function merge(args: string[]): number {
	const [out, ...inputs] = args;
	if (!out || inputs.length === 0) return fail("merge needs an output and at least one input");
	const merged = Object.assign({}, ...inputs.map((input) => readTimings(input)));
	writeFileSync(out, `${JSON.stringify(Object.fromEntries(Object.entries(merged).sort()), null, "\t")}\n`);
	console.log(`✓ ${Object.keys(merged).length} file times → ${out}`);
	return 0;
}

function fail(message: string): number {
	console.error(`✗ ${message}`);
	return 1;
}

if (import.meta.main) {
	const [command, ...rest] = process.argv.slice(2);
	process.exit(
		command === "run" ? run(rest) : command === "merge" ? merge(rest) : fail(`unknown command '${command}'`)
	);
}
