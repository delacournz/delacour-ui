/**
 * Splits `ci.yml` runs into waiting, setup and running, per job, at p50 and p95 — the numbers every
 * CI pull request quotes as its before and after.
 *
 *   bun scripts/ci-audit.ts --last 150                 the most recent completed runs that ran
 *   bun scripts/ci-audit.ts --runs 45032306580,45032310421
 *
 * - waiting: job created → runner picked it up (queue).
 * - setup: runner set-up, checkout, toolchain, cache restores and the install — everything before
 *   the job's first step that is the check itself.
 * - running: the check's own steps.
 * - teardown: post-job steps (cache saves, cleanup).
 *
 * "PR wall" is first job created → last job finished, leaving out `verify-expo`, which a dispatch
 * runs and an ordinary pull request does not, so a dispatched run compares with a pull request's.
 * Successful jobs only; cancelled runs are dropped.
 */
import { spawnSync } from "node:child_process";

export type Step = { name: string; started_at: string | null; completed_at: string | null };
export type Job = {
	name: string;
	run_id: number;
	created_at: string;
	started_at: string | null;
	completed_at: string | null;
	conclusion: string | null;
	steps?: Step[];
};
export type Phase = "setup" | "running" | "teardown";
export type Split = { job: string; waiting: number; setup: number; running: number; teardown: number };

const SETUP =
	/^(Set up job|Run actions\/checkout|Run oven-sh\/setup-bun|Run actions\/setup-node|Run actions\/cache|Install$)/;
const TEARDOWN = /^(Post |Complete job)/;
const EXCLUDED_FROM_WALL = /^CLI against a real Expo app/;

export function phaseOf(step: string): Phase {
	if (TEARDOWN.test(step)) return "teardown";
	if (SETUP.test(step)) return "setup";
	return "running";
}

const ms = (from: string | null, to: string | null): number =>
	from && to ? Math.max(0, Date.parse(to) - Date.parse(from)) : 0;

/** Nearest-rank percentile; NaN for no samples. */
export function percentile(values: readonly number[], p: number): number {
	if (values.length === 0) return Number.NaN;
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))] ?? Number.NaN;
}

export function splitJob(job: Job): Split {
	const split: Split = {
		job: job.name,
		waiting: ms(job.created_at, job.started_at),
		setup: 0,
		running: 0,
		teardown: 0,
	};
	for (const step of job.steps ?? []) split[phaseOf(step.name)] += ms(step.started_at, step.completed_at);
	return split;
}

/** First job created → last job finished, over the jobs a pull request runs. */
export function prWall(jobs: readonly Job[]): number {
	const live = jobs.filter((job) => job.started_at && job.completed_at && !EXCLUDED_FROM_WALL.test(job.name));
	if (live.length === 0) return 0;
	const start = Math.min(...live.map((job) => Date.parse(job.created_at)));
	const end = Math.max(...live.map((job) => Date.parse(job.completed_at as string)));
	return end - start;
}

/** Collapses a matrix leg's name onto its job: `render (3/4)` → `render (*)`. */
export const jobKey = (name: string): string => name.replace(/\(.*\)/, "(*)");

function gh<T>(path: string): T {
	const out = spawnSync("gh", ["api", path], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
	if (out.status !== 0) throw new Error(`gh api ${path}: ${out.stderr}`);
	return JSON.parse(out.stdout) as T;
}

const REPO = "delacournz/delacour-ui";
const sec = (value: number): string => (Number.isNaN(value) ? "   -" : `${(value / 1000).toFixed(0).padStart(4)}s`);

function runIds(args: string[]): number[] {
	const at = args.indexOf("--runs");
	if (at !== -1) return (args[at + 1] ?? "").split(",").map(Number).filter(Boolean);
	const last = Number(args[args.indexOf("--last") + 1] ?? 150) || 150;
	const ids: number[] = [];
	for (let page = 1; ids.length < last && page <= 20; page++) {
		const { workflow_runs } = gh<{ workflow_runs: { id: number; status: string; conclusion: string | null }[] }>(
			`repos/${REPO}/actions/workflows/ci.yml/runs?per_page=100&page=${page}&status=completed`
		);
		if (workflow_runs.length === 0) break;
		for (const run of workflow_runs)
			if (run.conclusion !== "skipped" && run.conclusion !== "cancelled") ids.push(run.id);
	}
	return ids.slice(0, last);
}

function main(args: string[]): void {
	const splits: Split[] = [];
	const walls: number[] = [];
	for (const id of runIds(args)) {
		const { jobs } = gh<{ jobs: Job[] }>(`repos/${REPO}/actions/runs/${id}/jobs?per_page=100&filter=latest`);
		walls.push(prWall(jobs));
		for (const job of jobs) if (job.conclusion === "success") splits.push(splitJob(job));
	}
	console.log(`${walls.length} runs · PR wall p50 ${sec(percentile(walls, 50))} p95 ${sec(percentile(walls, 95))}`);
	console.log(`${"job".padEnd(32)}   n | wait p50  p95 | setup p50  p95 | run p50   p95`);
	for (const key of [...new Set(splits.map((split) => jobKey(split.job)))].sort()) {
		const group = splits.filter((split) => jobKey(split.job) === key);
		const col = (phase: keyof Omit<Split, "job">) => group.map((split) => split[phase]);
		console.log(
			`${key.padEnd(32)} ${String(group.length).padStart(3)} | ${sec(percentile(col("waiting"), 50))} ${sec(percentile(col("waiting"), 95))} | ${sec(percentile(col("setup"), 50))}  ${sec(percentile(col("setup"), 95))} | ${sec(percentile(col("running"), 50))} ${sec(percentile(col("running"), 95))}`
		);
	}
}

if (import.meta.main) main(process.argv.slice(2));
