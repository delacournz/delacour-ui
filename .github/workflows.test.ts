import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Drift guard for the release pipeline's workflow files: which branch or tag each one reacts to, and
 * that every third-party action is pinned to a full commit SHA. A trigger that widens by accident
 * (promote on every branch, release on a plain push) or a floating `@v4` is a supply-chain or
 * publish-safety regression, so it fails here rather than in review.
 */
const WORKFLOWS = join(import.meta.dir, "workflows");

type Trigger = { branches?: string[]; tags?: string[] } | null;
type Workflow = { on: Record<string, Trigger> };

async function load(file: string): Promise<{ text: string; workflow: Workflow }> {
	const text = await Bun.file(join(WORKFLOWS, file)).text();
	return { text, workflow: Bun.YAML.parse(text) as Workflow };
}

describe("workflow triggers", () => {
	for (const file of ["version.yml", "promote.yml"]) {
		test(`${file} runs on pushes to develop only`, async () => {
			const { workflow } = await load(file);
			expect(Object.keys(workflow.on)).toEqual(["push"]);
			expect(workflow.on.push?.branches).toEqual(["develop"]);
			expect(workflow.on.push?.tags).toBeUndefined();
		});
	}

	test("release.yml runs on v* tags only", async () => {
		const { workflow } = await load("release.yml");
		expect(Object.keys(workflow.on)).toEqual(["push"]);
		expect(workflow.on.push?.tags).toEqual(["v*"]);
		expect(workflow.on.push?.branches).toBeUndefined();
	});
});

describe("action pins", () => {
	const files = readdirSync(WORKFLOWS).filter((file) => /\.ya?ml$/.test(file));

	test("there are workflows to check", () => {
		expect(files).toContain("version.yml");
		expect(files).toContain("promote.yml");
		expect(files).toContain("release.yml");
	});

	for (const file of files) {
		test(`${file}: every uses: is a full commit SHA with a version comment`, async () => {
			const { text } = await load(file);
			const uses = text.split("\n").filter((line) => /^\s*-?\s*uses:/.test(line));
			for (const line of uses) {
				const target = line.replace(/^\s*-?\s*uses:\s*/, "");
				if (target.startsWith("./")) continue;
				expect(target).toMatch(/@[0-9a-f]{40} # v\d/);
			}
		});
	}
});

describe("pipeline wiring", () => {
	test("release.yml refuses a tag that is not on main", async () => {
		const { text } = await load("release.yml");
		expect(text).toContain("merge-base --is-ancestor");
		expect(text).toContain("origin/main");
	});

	test("promote.yml never forces main", async () => {
		const { text } = await load("promote.yml");
		expect(text).not.toMatch(/push\s+(?:-f|--force)/);
		expect(text).toContain('git push origin "$SHA:refs/heads/main"');
	});

	test("version.yml names the next version in the PR title and squash commit", async () => {
		const { text } = await load("version.yml");
		expect(text).toContain("title=🔖 chore(release): v$version");
		expect(text).toMatch(/pr-title: \$\{\{ steps\.next\.outputs\.title \}\}/);
		expect(text).toMatch(/commit-message: \$\{\{ steps\.next\.outputs\.title \}\}/);
	});
});

/**
 * The repository is public, so GitHub-hosted runners are free, and every job runs on one. Namespace
 * profiles and their actions (mirror checkout, cache volume, remote turbo cache) are gone: a
 * `namespace-profile-*` label queues forever once the profile is deleted, and the actions fail
 * outright without a Namespace instance. Checkout and caches are GitHub's own actions.
 */
describe("GitHub-hosted runners", () => {
	type Job = { "runs-on"?: string };

	for (const file of readdirSync(WORKFLOWS).filter((name) => /\.ya?ml$/.test(name))) {
		test(`${file}: no Namespace runner or action`, async () => {
			const { text } = await load(file);
			expect(text).not.toMatch(/namespace-profile-|namespacelabs\/|namespace-actions\//);
			const { jobs } = Bun.YAML.parse(text) as { jobs: Record<string, Job> };
			for (const [name, job] of Object.entries(jobs)) {
				expect({ file, name, runsOn: job["runs-on"] }).toEqual({ file, name, runsOn: "ubuntu-latest" });
			}
		});
	}
});

/**
 * `bun install` resolves `@delacournz/*` from GitHub Packages with whatever `NPM_TOKEN` holds (see
 * `bunfig.toml`). In CI that is the job's own token, granted `packages: read`, and only on the step
 * that installs — never a personal access token from `secrets`, never workflow- or job-wide, and so
 * never beside an `npm publish` to registry.npmjs.org, which authenticates with OIDC alone.
 */
describe("GitHub Packages token", () => {
	type Permissions = Record<string, string> | string | undefined;
	type Step = { name?: string; run?: string; env?: Record<string, string>; with?: Record<string, unknown> };
	type Job = { permissions?: Permissions; env?: Record<string, string>; steps?: Step[] };
	type Parsed = { permissions?: Permissions; env?: Record<string, string>; jobs: Record<string, Job> };
	const JOB_TOKEN = "${{ github.token }}";
	const installs = (step: Step) =>
		/\bbun install\b/.test(step.run ?? "") || /\bbun run version\b/.test(String(step.with?.["version-script"] ?? ""));
	const publishes = (step: Step) => /\bnpm publish\b|changeset-alpha\.ts/.test(step.run ?? "");
	const files = readdirSync(WORKFLOWS).filter((name) => /\.ya?ml$/.test(name));

	for (const file of files) {
		test(`${file}: NPM_TOKEN is the job token, on install steps only, with packages: read`, async () => {
			const { text } = await load(file);
			expect(text).not.toContain("secrets.NPM_TOKEN");
			const parsed = Bun.YAML.parse(text) as Parsed;
			expect(parsed.env?.NPM_TOKEN).toBeUndefined();
			for (const [name, job] of Object.entries(parsed.jobs)) {
				expect({ file, name, jobEnv: job.env?.NPM_TOKEN }).toEqual({ file, name, jobEnv: undefined });
				const steps = job.steps ?? [];
				const effective = job.permissions ?? parsed.permissions;
				for (const step of steps) {
					const label = step.name ?? step.run ?? "step";
					if (installs(step)) {
						expect({ file, name, label, token: step.env?.NPM_TOKEN }).toEqual({ file, name, label, token: JOB_TOKEN });
						const packages = typeof effective === "object" ? effective.packages : effective;
						expect({ file, name, packages }).toEqual({ file, name, packages: "read" });
					} else {
						expect({ file, name, label, token: step.env?.NPM_TOKEN }).toEqual({ file, name, label, token: undefined });
					}
					if (publishes(step)) expect(installs(step)).toBe(false);
				}
			}
		});
	}
});
