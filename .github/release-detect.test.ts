import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

/**
 * The `detect` steps of `version.yml` and `promote.yml` decide whether a push versions or releases,
 * and both are plain shell inside YAML. These tests lift each script out of its workflow and run it
 * in a throwaway clone, the way the runner does after `actions/checkout` with `fetch-depth: 0`, so a
 * regression in the decision fails here and not on `develop`.
 */
const WORKFLOWS = join(import.meta.dir, "workflows");
const PUBLISHED = [
	"packages/cli",
	"packages/react-native-ui",
	"packages/react-native-charts",
	"packages/react-native-bottom-sheet",
];

type Step = { id?: string; run?: string };
type Workflow = { jobs: Record<string, { steps: Step[] }> };

async function detectScript(file: string): Promise<string> {
	const workflow = Bun.YAML.parse(await Bun.file(join(WORKFLOWS, file)).text()) as Workflow;
	for (const job of Object.values(workflow.jobs)) {
		const step = job.steps.find((candidate) => candidate.id === "detect");
		if (step?.run) return step.run;
	}
	throw new Error(`${file} has no detect step`);
}

const scratch = mkdtempSync(join(tmpdir(), "release-detect-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

let counter = 0;

/** A bare `origin` plus an authoring clone that commits to `develop` and moves `main`. */
async function makeRepo() {
	counter += 1;
	const root = join(scratch, `repo-${counter}`);
	const origin = join(root, "origin.git");
	const work = join(root, "work");
	await $`git init -q --bare -b develop ${origin}`.quiet();
	await $`git clone -q ${origin} ${work}`.quiet();
	await $`git -C ${work} checkout -q -b develop`.quiet();
	await $`git -C ${work} config user.email t@example.com`.quiet();
	await $`git -C ${work} config user.name t`.quiet();

	const commit = async (
		message: string,
		change: { versions?: string | Record<string, string>; changesets?: string[] }
	) => {
		if (change.versions !== undefined) {
			for (const dir of PUBLISHED) {
				const version = typeof change.versions === "string" ? change.versions : (change.versions[dir] ?? "0.0.0");
				await Bun.write(join(work, dir, "package.json"), `${JSON.stringify({ name: dir, version })}\n`);
			}
		}
		await $`rm -rf ${join(work, ".changeset")}`.quiet();
		await Bun.write(join(work, ".changeset", "README.md"), "queue\n");
		for (const name of change.changesets ?? []) await Bun.write(join(work, ".changeset", name), "---\n---\n");
		await Bun.write(join(work, "log.txt"), `${message}\n`);
		await $`git -C ${work} add -A`.quiet();
		await $`git -C ${work} commit -q -m ${message}`.quiet();
		return (await $`git -C ${work} rev-parse HEAD`.text()).trim();
	};

	const push = async () => {
		await $`git -C ${work} push -q origin develop`.quiet();
	};
	const setMain = async (sha: string) => {
		await $`git -C ${work} push -q -f origin ${sha}:refs/heads/main`.quiet();
	};
	const tag = async (name: string, sha: string) => {
		await $`git -C ${work} tag ${name} ${sha}`.quiet();
		await $`git -C ${work} push -q origin ${name}`.quiet();
	};

	/** Clone at `sha` like the runner does, run the script, return its GITHUB_OUTPUT as a record. */
	const run = async (script: string, sha: string, before?: string) => {
		const dir = join(root, `run-${Math.random().toString(36).slice(2)}`);
		await $`git clone -q ${origin} ${dir}`.quiet();
		await $`git -C ${dir} checkout -q --detach ${sha}`.quiet();
		const output = join(dir, ".github-output");
		await Bun.write(output, "");
		const result = await $`bash -e -o pipefail -c ${script}`
			.cwd(dir)
			.env({ ...process.env, GITHUB_OUTPUT: output, BEFORE: before ?? "0".repeat(40) })
			.nothrow()
			.quiet();
		if (result.exitCode !== 0) throw new Error(`detect exited ${result.exitCode}: ${result.stderr}${result.stdout}`);
		const lines = (await Bun.file(output).text()).split("\n").filter(Boolean);
		return Object.fromEntries(lines.map((line) => line.split("=", 2) as [string, string]));
	};

	return { commit, push, setMain, tag, run };
}

describe("version.yml detect", () => {
	test("versions from develop's tip when changesets are pending", async () => {
		const repo = await makeRepo();
		const base = await repo.commit("release", { versions: "0.5.0" });
		const tip = await repo.commit("feature", { changesets: ["a.md"] });
		await repo.push();
		expect((await repo.run(await detectScript("version.yml"), tip, base)).skip).toBe("false");
	});

	test("skips the version commit itself", async () => {
		const repo = await makeRepo();
		const base = await repo.commit("feature", { versions: "0.5.0", changesets: ["a.md"] });
		const tip = await repo.commit("🔖 chore(release): v0.6.0", { versions: "0.6.0" });
		await repo.push();
		expect((await repo.run(await detectScript("version.yml"), tip, base)).skip).toBe("true");
	});

	test("skips a stale rerun once develop has moved on, so it cannot overwrite the newer version PR", async () => {
		const repo = await makeRepo();
		const base = await repo.commit("release", { versions: "0.5.0" });
		const stale = await repo.commit("feature a", { changesets: ["a.md"] });
		await repo.commit("feature b", { changesets: ["a.md", "b.md"] });
		await repo.push();
		expect((await repo.run(await detectScript("version.yml"), stale, base)).skip).toBe("true");
	});
});

describe("promote.yml detect", () => {
	test("releases the version commit when it is the push", async () => {
		const repo = await makeRepo();
		const released = await repo.commit("old", { versions: "0.5.0" });
		await repo.setMain(released);
		const feature = await repo.commit("feature", { changesets: ["a.md"] });
		const version = await repo.commit("🔖 chore(release): v0.6.0", { versions: "0.6.0" });
		await repo.push();
		await repo.tag("v0.5.0", released);
		const out = await repo.run(await detectScript("promote.yml"), version, feature);
		expect(out).toEqual({ release: "true", version: "0.6.0", sha: version });
	});

	test("recovers a version commit whose own run was evicted by a later push", async () => {
		const repo = await makeRepo();
		const released = await repo.commit("old", { versions: "0.5.0" });
		await repo.setMain(released);
		await repo.commit("feature", { changesets: ["a.md"] });
		const version = await repo.commit("🔖 chore(release): v0.6.0", { versions: "0.6.0" });
		const docs = await repo.commit("docs", {});
		await repo.push();
		await repo.tag("v0.5.0", released);
		const out = await repo.run(await detectScript("promote.yml"), docs, version);
		expect(out).toEqual({ release: "true", version: "0.6.0", sha: version });
	});

	test("still releases the version commit when a later merge added a new changeset", async () => {
		const repo = await makeRepo();
		const released = await repo.commit("old", { versions: "0.5.0" });
		await repo.setMain(released);
		await repo.commit("feature", { changesets: ["a.md"] });
		const version = await repo.commit("🔖 chore(release): v0.6.0", { versions: "0.6.0" });
		const next = await repo.commit("next feature", { changesets: ["b.md"] });
		await repo.push();
		const out = await repo.run(await detectScript("promote.yml"), next, version);
		expect(out).toEqual({ release: "true", version: "0.6.0", sha: version });
	});

	test("finishes a promote that moved main but never pushed the tag", async () => {
		const repo = await makeRepo();
		await repo.commit("feature", { versions: "0.5.0", changesets: ["a.md"] });
		const version = await repo.commit("🔖 chore(release): v0.6.0", { versions: "0.6.0" });
		await repo.push();
		await repo.setMain(version);
		const out = await repo.run(await detectScript("promote.yml"), version);
		expect(out).toEqual({ release: "true", version: "0.6.0", sha: version });
	});

	test("does nothing once the tag exists", async () => {
		const repo = await makeRepo();
		await repo.commit("feature", { versions: "0.5.0", changesets: ["a.md"] });
		const version = await repo.commit("🔖 chore(release): v0.6.0", { versions: "0.6.0" });
		const docs = await repo.commit("docs", {});
		await repo.push();
		await repo.setMain(version);
		await repo.tag("v0.6.0", version);
		expect((await repo.run(await detectScript("promote.yml"), docs, version)).release).toBe("false");
	});

	test("ignores a version bump that left changesets pending", async () => {
		const repo = await makeRepo();
		await repo.commit("old", { versions: "0.5.0" });
		const bump = await repo.commit("hand bump", { versions: "0.6.0", changesets: ["a.md"] });
		await repo.push();
		expect((await repo.run(await detectScript("promote.yml"), bump)).release).toBe("false");
	});

	test("ignores a release from before the fixed group, whose packages disagree", async () => {
		const repo = await makeRepo();
		const legacy = await repo.commit("🔖 chore(release): version packages", {
			versions: {
				"packages/cli": "0.5.1",
				"packages/react-native-ui": "0.5.0",
				"packages/react-native-charts": "0.2.0",
				"packages/react-native-bottom-sheet": "0.3.0",
			},
		});
		const docs = await repo.commit("docs", {});
		await repo.push();
		await repo.setMain(legacy);
		expect((await repo.run(await detectScript("promote.yml"), docs, legacy)).release).toBe("false");
	});
});
