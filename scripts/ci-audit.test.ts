import { describe, expect, test } from "bun:test";
import { type Job, jobKey, percentile, phaseOf, prWall, splitJob } from "./ci-audit";

const at = (s: number) => new Date(Date.UTC(2026, 10, 22, 0, 0, s)).toISOString();

describe("phaseOf", () => {
	test.each([
		["Set up job", "setup"],
		["Run actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1", "setup"],
		["Run oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6", "setup"],
		["Run actions/cache/restore@55cc8345863c7cc4c66a329aec7e433d2d1c52a9", "setup"],
		["Install", "setup"],
		["Run bun run typecheck", "running"],
		["Run shard 2/4", "running"],
		["Post Run actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9", "teardown"],
		["Complete job", "teardown"],
	])("%s is %s", (step, phase) => {
		expect(phaseOf(step)).toBe(phase);
	});
});

describe("percentile", () => {
	test("is nearest-rank", () => {
		expect(percentile([5, 1, 3, 2, 4], 50)).toBe(3);
		expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95)).toBe(10);
	});

	test("is NaN with no samples", () => {
		expect(percentile([], 50)).toBeNaN();
	});
});

describe("splitJob", () => {
	test("puts each step in its phase, and the queue in waiting", () => {
		const job: Job = {
			name: "typecheck",
			run_id: 1,
			created_at: at(0),
			started_at: at(3),
			completed_at: at(40),
			conclusion: "success",
			steps: [
				{ name: "Set up job", started_at: at(3), completed_at: at(4) },
				{ name: "Install", started_at: at(4), completed_at: at(10) },
				{ name: "Run bun run typecheck", started_at: at(10), completed_at: at(38) },
				{ name: "Complete job", started_at: at(38), completed_at: at(40) },
			],
		};
		expect(splitJob(job)).toEqual({ job: "typecheck", waiting: 3000, setup: 7000, running: 28000, teardown: 2000 });
	});
});

describe("prWall", () => {
	const job = (name: string, from: number, to: number): Job => ({
		name,
		run_id: 1,
		created_at: at(from),
		started_at: at(from + 1),
		completed_at: at(to),
		conclusion: "success",
	});

	test("spans first created to last finished", () => {
		expect(prWall([job("resolve", 0, 2), job("test", 2, 50), job("signoff", 50, 55)])).toBe(55_000);
	});

	test("leaves out verify-expo, which an ordinary pull request does not run", () => {
		expect(prWall([job("test", 0, 50), job("CLI against a real Expo app (monorepo)", 0, 300)])).toBe(50_000);
	});
});

test("jobKey folds matrix legs together", () => {
	expect(jobKey("render (3/4)")).toBe("render (*)");
	expect(jobKey("typecheck")).toBe("typecheck");
});
