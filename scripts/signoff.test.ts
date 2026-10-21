import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { TEST_RUNNERS } from "../packages/cli/src/registry/test-runner";
import {
	commandLabel,
	describeRunner,
	describeTiming,
	GH_SIGNOFF_SUBCOMMANDS,
	parseTurboSummary,
	renderReport,
	signoffArgv,
	turboTaskName,
	umbrellaEarned,
} from "./signoff";
import { ALWAYS_CONTEXTS, planChecks, REQUIRED_CONTEXTS, SIGNOFF_CHECKS, UMBRELLA_CONTEXT } from "./signoff-checks";

/** The contexts a diff would actually run, for terse assertions. */
function applicable(changed: string[]): string[] {
	return planChecks(changed)
		.filter((entry) => entry.applicable)
		.map((entry) => entry.check.context);
}

describe("planChecks", () => {
	test("a docs-only diff runs the four always-on checks and nothing else", () => {
		expect(applicable(["AGENTS.md", "packages/react-native-ui/src/components/button/AGENTS.md"]).sort()).toEqual([
			"build",
			"check",
			"test",
			"typecheck",
		]);
	});

	test("every always-on check is applicable even with an empty diff", () => {
		expect(applicable([])).toEqual([...ALWAYS_CONTEXTS]);
	});

	test("a component change runs the registry drift check", () => {
		expect(applicable(["packages/react-native-ui/src/components/button/button.tsx"])).toContain("registry");
	});

	test("a CLI or skills change runs the registry drift check", () => {
		expect(applicable(["packages/cli/src/registry/build.ts"])).toContain("registry");
		expect(applicable(["packages/skills/src/render-components.ts"])).toContain("registry");
	});

	test("a dependency change runs the registry drift check — ranges land in registry metadata", () => {
		expect(applicable(["bun.lock"])).toContain("registry");
	});

	test("a docs-site or playground change runs the always-on checks and the copied tests, not the registry", () => {
		expect(applicable(["apps/web/src/routes/index.tsx"])).toEqual([...ALWAYS_CONTEXTS, "tests"]);
		expect(applicable(["apps/playground/src/app/index.tsx"])).toEqual([...ALWAYS_CONTEXTS, "tests"]);
	});

	test("every change but markdown runs the copied tests", () => {
		expect(applicable(["packages/cli/src/registry/test-runner.ts"])).toContain("tests");
		expect(applicable(["bun.lock"])).toContain("tests");
		expect(applicable(["README.md"])).not.toContain("tests");
	});

	test("the copied tests run under every runner a consumer may use", () => {
		const tests = SIGNOFF_CHECKS.find((check) => check.context === "tests");
		const runners = (tests?.run ?? []).map((step) => step.argv[step.argv.indexOf("--tests") + 1]);
		expect(runners.sort()).toEqual([...TEST_RUNNERS].sort());
	});

	test("the two checks that rebuild .verify/app never run at once", () => {
		const locks = SIGNOFF_CHECKS.filter((check) => ["registry", "tests"].includes(check.context)).map(
			(check) => check.locks ?? []
		);
		expect(locks[0]?.some((lock) => locks[1]?.includes(lock))).toBe(true);
	});

	test("markdown never triggers a path-gated check", () => {
		expect(applicable(["packages/cli/AGENTS.md"])).toEqual([...ALWAYS_CONTEXTS]);
		expect(applicable(["apps/web/content/docs/native/cli/commands.mdx"])).not.toContain("registry");
	});

	test("a markdown file alongside real source does not mask the real source", () => {
		expect(applicable(["packages/cli/AGENTS.md", "packages/cli/src/index.ts"])).toContain("registry");
	});

	test("skipped entries carry a reason naming the paths that did not match", () => {
		const registry = planChecks(["apps/web/src/routes/index.tsx"]).find((entry) => entry.check.context === "registry");
		expect(registry?.applicable).toBe(false);
		expect(registry?.reason).toContain("packages/react-native-ui/**");
	});
});

describe("required contexts", () => {
	test("the required list is the umbrella plus the always-on checks", () => {
		expect(REQUIRED_CONTEXTS).toEqual([
			UMBRELLA_CONTEXT,
			...ALWAYS_CONTEXTS.map((context) => `${UMBRELLA_CONTEXT}/${context}`),
		]);
	});

	test("no path-gated check is in the required list — one that never arrives deadlocks the PR", () => {
		for (const check of SIGNOFF_CHECKS) {
			if (check.always) continue;
			expect(REQUIRED_CONTEXTS).not.toContain(`${UMBRELLA_CONTEXT}/${check.context}`);
		}
	});
});

describe("umbrellaEarned", () => {
	const passed = { context: "typecheck", label: "typecheck", status: "passed" } as const;
	const failed = { context: "test", label: "test", status: "failed" } as const;
	const skipped = { context: "registry", label: "registry", status: "skipped" } as const;

	test("granted when every check that ran passed", () => {
		expect(umbrellaEarned([passed, skipped])).toBe(true);
	});

	test("withheld when any applicable check failed", () => {
		expect(umbrellaEarned([passed, failed, skipped])).toBe(false);
	});

	test("withheld when nothing ran at all", () => {
		expect(umbrellaEarned([skipped])).toBe(false);
	});
});

describe("signoffArgv", () => {
	const SHA = "fef9cfbec6816aa17c09971c704696818782e921";

	test("names `create` explicitly so no context can be read as a subcommand", () => {
		// The regression this exists for: `check` is BOTH a required context and a gh-signoff
		// subcommand, so `gh signoff check --commit <sha>` was parsed as the subcommand and died
		// on "--commit is only valid for create and status" — writing no status, while the run
		// still exited 0 and the checks panel still looked green.
		expect(signoffArgv(SHA, "check")).toEqual(["gh", "signoff", "create", "check", "--commit", SHA]);
	});

	test("every check this repo defines survives the collision", () => {
		for (const check of SIGNOFF_CHECKS) {
			const argv = signoffArgv(SHA, check.context);
			expect(argv[2]).toBe("create");
			expect(argv[3]).toBe(check.context);
		}
	});

	test("the umbrella is written with no context at all", () => {
		expect(signoffArgv(SHA, null)).toEqual(["gh", "signoff", "create", "--commit", SHA]);
	});

	test("a context colliding with any subcommand is still passed as a context", () => {
		// Not just `check`: whichever context name a future required check takes, the command word
		// is already spoken for, so gh-signoff can only read it as a context.
		for (const subcommand of GH_SIGNOFF_SUBCOMMANDS) {
			expect(signoffArgv(SHA, subcommand)).toEqual(["gh", "signoff", "create", subcommand, "--commit", SHA]);
		}
	});
});

describe("describeRunner", () => {
	test("names Claude Code when an agent signs off", () => {
		expect(describeRunner({ CLAUDECODE: "1" })).toBe("Claude Code");
	});

	test("names Claude Code from the entrypoint var alone", () => {
		expect(describeRunner({ CLAUDE_CODE_ENTRYPOINT: "cli" })).toBe("Claude Code");
	});

	test("reports a plain shell as human", () => {
		expect(describeRunner({})).toContain("human");
	});

	test("a dispatched workflow reports itself, not a human", () => {
		expect(describeRunner({ GITHUB_ACTIONS: "true", GITHUB_WORKFLOW: "CI" })).toBe("GitHub Actions (CI)");
	});
});

describe("renderReport", () => {
	const report = renderReport({
		sha: "4c75ae3f1d2b",
		actor: "chrismitchellnz",
		runner: "Claude Code",
		when: "2026-08-09 14:02 NZST",
		outcomes: [
			{ context: "typecheck", label: "typecheck", status: "passed", durationMs: 12_000 },
			{ context: "test", label: "test", status: "passed", durationMs: 221_000, note: "a qualifying note" },
			{
				context: "registry",
				label: "registry",
				status: "skipped",
				reason: "no files matched packages/react-native-ui/**",
			},
		],
	});

	test("carries the marker so a re-run updates in place instead of stacking comments", () => {
		expect(report.startsWith("<!-- signoff-report -->")).toBe(true);
	});

	test("names who signed off and what ran it", () => {
		expect(report).toContain("@chrismitchellnz");
		expect(report).toContain("Claude Code");
	});

	test("pins the SHA the statuses are bound to", () => {
		expect(report).toContain("4c75ae3");
	});

	test("shows durations, notes and the reason a check was skipped", () => {
		expect(report).toContain("12s");
		expect(report).toContain("3m 41s");
		expect(report).toContain("a qualifying note");
		expect(report).toContain("no files matched packages/react-native-ui/**");
	});

	test("a withheld umbrella is stated, not implied by an absent row", () => {
		const failing = renderReport({
			sha: "deadbee",
			actor: "chrismitchellnz",
			runner: "human (interactive shell)",
			when: "now",
			outcomes: [{ context: "test", label: "test", status: "failed", durationMs: 1000 }],
		});
		expect(failing).toContain("not signed off");
	});

	test("the detail column names the slowest turbo task, not just the check total", () => {
		// The regression: `build 5m 11s` was the whole report, and 5m 10s of it was one workspace
		// hanging. The check total said a build was slow; it could not say which build.
		const slow = renderReport({
			sha: "4c75ae3f1d2b",
			actor: "chrismitchellnz",
			runner: "human (interactive shell)",
			when: "now",
			outcomes: [
				{
					context: "build",
					label: "build",
					status: "passed",
					durationMs: 310_733,
					timings: [
						{
							label: "bunx turbo build",
							durationMs: 310_733,
							tasks: [
								{ taskId: "@delacour/splitpush#build", durationMs: 310_587, cached: false },
								{ taskId: "@delacour/web#build", durationMs: 6570, cached: false },
							],
						},
					],
				},
			],
		});
		expect(slow).toContain("@delacour/splitpush#build");
		expect(slow).toContain("5m 11s");
	});

	test("a breakdown does not displace the note that qualifies the pass", () => {
		const hollow = renderReport({
			sha: "4c75ae3f1d2b",
			actor: "chrismitchellnz",
			runner: "human (interactive shell)",
			when: "now",
			outcomes: [
				{
					context: "test",
					label: "test",
					status: "passed",
					durationMs: 4000,
					note: "a qualifying note",
					timings: [
						{
							label: "bunx turbo test",
							durationMs: 4000,
							tasks: [{ taskId: "a#test", durationMs: 3000, cached: false }],
						},
					],
				},
			],
		});
		expect(hollow).toContain("a#test");
		expect(hollow).toContain("a qualifying note");
	});
});

/** A payload shaped like what `turbo --summarize` writes to `.turbo/runs/<id>.json` (turbo 2.9). */
function summaryFixture(
	tasks: readonly { taskId: string; startTime: number; endTime: number; status?: string }[]
): unknown {
	return {
		id: "3JEY4h5i2PCcZ20jhtwLsZbWP65",
		turboVersion: "2.9.16",
		execution: { command: "turbo run build", startTime: 1_789_227_194_179, endTime: 1_789_227_504_912, exitCode: 0 },
		tasks: tasks.map((task) => ({
			taskId: task.taskId,
			task: task.taskId.split("#")[1],
			package: task.taskId.split("#")[0],
			cache: { local: false, remote: false, status: task.status ?? "MISS", timeSaved: 0 },
			execution: { startTime: task.startTime, endTime: task.endTime, exitCode: 0 },
		})),
	};
}

describe("parseTurboSummary", () => {
	test("returns every task slowest first, in wall-clock milliseconds", () => {
		// The real numbers from the run this instrumentation was written for.
		const tasks = parseTurboSummary(
			summaryFixture([
				{ taskId: "@delacour/auth-api#build", startTime: 1000, endTime: 1415 },
				{ taskId: "@delacour/splitpush#build", startTime: 1000, endTime: 311_587 },
				{ taskId: "@delacour/web#build", startTime: 1000, endTime: 7570 },
			])
		);
		expect(tasks?.map((task) => task.taskId)).toEqual([
			"@delacour/splitpush#build",
			"@delacour/web#build",
			"@delacour/auth-api#build",
		]);
		expect(tasks?.[0]?.durationMs).toBe(310_587);
	});

	test("a cache HIT reads as cached, so a replay cannot pass for fast work", () => {
		const tasks = parseTurboSummary(
			summaryFixture([
				{ taskId: "@delacour/types#check", startTime: 1000, endTime: 1000, status: "HIT" },
				{ taskId: "@delacour/db#check", startTime: 1000, endTime: 2000 },
			])
		);
		expect(tasks?.find((task) => task.taskId === "@delacour/types#check")?.cached).toBe(true);
		expect(tasks?.find((task) => task.taskId === "@delacour/db#check")?.cached).toBe(false);
	});

	test("an unrecognisable payload yields null rather than a wrong answer", () => {
		expect(parseTurboSummary(null)).toBeNull();
		expect(parseTurboSummary("not json")).toBeNull();
		expect(parseTurboSummary({})).toBeNull();
		expect(parseTurboSummary({ tasks: "nope" })).toBeNull();
	});

	test("a task missing its execution block is dropped, never guessed at", () => {
		const tasks = parseTurboSummary({
			execution: { command: "turbo run build" },
			tasks: [
				{ taskId: "@delacour/web#build" },
				{ taskId: "@delacour/db#build", execution: { startTime: 0, endTime: 5 } },
				{ taskId: 7, execution: { startTime: 0, endTime: 900 } },
			],
		});
		expect(tasks).toEqual([{ taskId: "@delacour/db#build", durationMs: 5, cached: false }]);
	});

	test("a run that matched no task is empty, which is not the same as unparseable", () => {
		expect(parseTurboSummary({ execution: {}, tasks: [] })).toEqual([]);
	});
});

describe("turboTaskName", () => {
	test("names the task every always-on check runs, so --summarize can be added to it", () => {
		for (const context of ALWAYS_CONTEXTS) {
			const check = SIGNOFF_CHECKS.find((entry) => entry.context === context);
			expect(check).toBeDefined();
			for (const command of check?.run ?? []) expect(turboTaskName(command.argv)).toBe(context);
		}
	});

	test("skips an explicit `run` verb", () => {
		expect(turboTaskName(["bunx", "turbo", "run", "build", "--concurrency=6"])).toBe("build");
		expect(turboTaskName(["turbo", "build"])).toBe("build");
	});

	test("a non-turbo command has no task — cargo and playwright write no summary", () => {
		expect(turboTaskName(["cargo", "test", "-p", "folio"])).toBeNull();
		expect(turboTaskName(["bunx", "playwright", "test"])).toBeNull();
		expect(turboTaskName(["git", "diff", "--exit-code"])).toBeNull();
	});

	test("`turbo` deeper in an argv is an argument, not the command being run", () => {
		expect(turboTaskName(["cargo", "test", "-p", "turbo"])).toBeNull();
	});

	test("a turbo invocation carrying only flags names no task", () => {
		expect(turboTaskName(["bunx", "turbo", "--version"])).toBeNull();
	});
});

describe("describeTiming", () => {
	function task(taskId: string, durationMs: number, cached = false) {
		return { taskId, durationMs, cached };
	}

	test("names the slowest task and how many ran alongside it", () => {
		const detail = describeTiming([
			{
				label: "bunx turbo build",
				durationMs: 310_733,
				tasks: [task("@delacour/splitpush#build", 310_587), task("@delacour/web#build", 6570)],
			},
		]);
		expect(detail).toContain("@delacour/splitpush#build");
		expect(detail).toContain("5m 11s");
		expect(detail).toContain("2 tasks");
	});

	test("a fully replayed run says so — a cache hit is not evidence the work ran", () => {
		const detail = describeTiming([
			{ label: "bunx turbo check", durationMs: 900, tasks: [task("a#check", 0, true), task("b#check", 0, true)] },
		]);
		expect(detail).toContain("replayed from cache");
		expect(detail).not.toContain("slowest");
	});

	test("a partly replayed run counts the cache hits beside the slowest task that really ran", () => {
		const detail = describeTiming([
			{ label: "bunx turbo check", durationMs: 4000, tasks: [task("a#check", 3000), task("b#check", 0, true)] },
		]);
		expect(detail).toContain("a#check");
		expect(detail).toContain("1 cached");
	});

	test("a multi-command check breaks down per command", () => {
		const detail = describeTiming([
			{ label: "cargo test -p quarry -p delacour-tauri", durationMs: 110_000, tasks: [] },
			{ label: "cargo test -p tauri-plugin-quarry-db", durationMs: 18_000, tasks: [] },
			{ label: "git diff --exit-code", durationMs: 2000, tasks: [] },
		]);
		expect(detail).toContain("cargo test -p tauri-plugin-quarry-db");
		expect(detail).toContain("1m 50s");
		expect(detail).toContain("18s");
	});

	test("one command with no tasks adds nothing — the check's own duration already said it", () => {
		expect(describeTiming([{ label: "bunx playwright test", durationMs: 90_000, tasks: [] }])).toBeUndefined();
		expect(describeTiming([])).toBeUndefined();
	});
});

describe("commandLabel", () => {
	test("keeps a short command whole", () => {
		expect(commandLabel(["git", "diff", "--exit-code"])).toBe("git diff --exit-code");
	});

	test("truncates a long one rather than wrapping the report table", () => {
		const label = commandLabel(["bunx", "turbo", "build", "--concurrency=6", "--continue=dependencies-successful"]);
		expect(label.length).toBeLessThanOrEqual(48);
		expect(label.endsWith("…")).toBe(true);
	});

	test("escapes a pipe, which would otherwise split the markdown table cell", () => {
		expect(commandLabel(["sh", "-c", "a|b"])).toBe("sh -c a\\|b");
	});
});

describe("drift guard", () => {
	test("every check points at a workflow file that exists", () => {
		for (const check of SIGNOFF_CHECKS) {
			expect(existsSync(`.github/workflows/${check.workflow}`)).toBe(true);
		}
	});

	test("develop-protected requires exactly the signoff contexts", async () => {
		// The ruleset is the other half of the contract. A context required there and never written
		// here blocks every pull request forever; one written here and not required there gates nothing.
		const ruleset = (await Bun.file(".github/rulesets/develop.json").json()) as {
			rules: { type: string; parameters?: { required_status_checks?: { context: string }[] } }[];
		};
		const rule = ruleset.rules.find((entry) => entry.type === "required_status_checks");
		const contexts = (rule?.parameters?.required_status_checks ?? []).map((check) => check.context);
		expect(contexts.sort()).toEqual([...REQUIRED_CONTEXTS].sort());
	});

	test("ci.yml no longer runs on an ordinary pull request or a push to develop", async () => {
		// The reason this file exists: those runs were billed twice for work already verified locally.
		const workflow = Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text()) as {
			on: Record<string, { branches?: string[] } | null>;
			jobs: Record<string, { if?: string }>;
		};
		expect(workflow.on.push?.branches ?? []).not.toContain("develop");
		if ("pull_request" in workflow.on) {
			for (const [name, job] of Object.entries(workflow.jobs)) {
				expect({ name, gated: job.if?.includes("changeset-release/develop") ?? false }).toEqual({ name, gated: true });
			}
		}
	});

	test("no check declares an empty command", () => {
		for (const check of SIGNOFF_CHECKS) {
			expect(check.run.length).toBeGreaterThan(0);
			for (const command of check.run) expect(command.argv.length).toBeGreaterThan(0);
		}
	});

	test("contexts are unique", () => {
		const contexts = SIGNOFF_CHECKS.map((check) => check.context);
		expect(new Set(contexts).size).toBe(contexts.length);
	});
});
