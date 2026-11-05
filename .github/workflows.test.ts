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
 * Namespace runners carry a cache volume and a Git mirror (the `namespace-profile-linux-medium` profile
 * has both enabled), so a job there checks out from the mirror, keeps Bun's install cache on the
 * volume, and points turbo at Namespace's remote cache. A GitHub-hosted job has neither the volume
 * nor the instance token, so it must not use any of the three: each one fails outright there.
 */
describe("Namespace caching", () => {
	type Step = { uses?: string; run?: string; with?: Record<string, string | number | boolean> };
	type Job = { "runs-on"?: string; steps?: Step[] };
	const TURBO_SCRIPT = /\bbun run (typecheck|check|test|build)\b/;
	const uses = (name: string) => (step: Step) => step.uses?.startsWith(`${name}@`) ?? false;
	const runs = (pattern: RegExp) => (step: Step) => pattern.test(step.run ?? "");
	const bunCache = (step: Step) =>
		uses("namespacelabs/nscloud-cache-action")(step) &&
		String(step.with?.cache ?? "")
			.split("\n")
			.includes("bun");

	function githubHostedViolations(steps: Step[]): string[] {
		return steps
			.filter((step) => /^namespace(labs|-actions)\//.test(step.uses ?? ""))
			.map((step) => `GitHub-hosted job uses ${step.uses}`);
	}

	function namespaceViolations(steps: Step[]): string[] {
		const at = (predicate: (step: Step) => boolean) => steps.findIndex(predicate);
		const found: string[] = [];
		if (at(uses("actions/checkout")) !== -1) found.push("uses actions/checkout, not nscloud-checkout-action");

		const bun = at(uses("oven-sh/setup-bun"));
		const cache = at(bunCache);
		if (bun !== -1 && !(cache > bun && cache < at(runs(/\bbun install\b/))))
			found.push("no `cache: bun` nscloud-cache-action between setup-bun and bun install");

		const nodeCached = steps
			.filter(uses("actions/setup-node"))
			.some((step) => step.with?.["package-manager-cache"] !== false);
		if (nodeCached) found.push("setup-node without package-manager-cache: false");

		const turbo = at(runs(TURBO_SCRIPT));
		const remote = at(uses("namespace-actions/setup-turbocache"));
		if (turbo !== -1 && !(remote !== -1 && remote < turbo)) found.push("runs turbo before setup-turbocache");
		return found;
	}

	for (const file of readdirSync(WORKFLOWS).filter((name) => /\.ya?ml$/.test(name))) {
		test(`${file}: Namespace jobs use the mirror checkout, the bun cache volume and the turbo cache`, async () => {
			const { text } = await load(file);
			const { jobs } = Bun.YAML.parse(text) as { jobs: Record<string, Job> };
			for (const [name, job] of Object.entries(jobs)) {
				const steps = job.steps ?? [];
				const namespace = job["runs-on"]?.startsWith("namespace-profile-") ?? false;
				const violations = namespace ? namespaceViolations(steps) : githubHostedViolations(steps);
				expect({ file, name, violations }).toEqual({ file, name, violations: [] });
			}
		});
	}
});
