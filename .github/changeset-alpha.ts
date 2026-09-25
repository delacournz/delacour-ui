/**
 * The alpha half of the release flow, run by `.github/workflows/alpha.yml` on
 * every push to `develop` that carries a pending changeset.
 *
 *   1. `changeset version --snapshot alpha` — every package a pending
 *      changeset names, plus its dependents, gets `x.y.z-alpha.<datetime>`:
 *      the version the next release would give it, with a suffix that sorts
 *      after every earlier snapshot. `.changeset/config.json` sets that shape.
 *      The bump is never committed; the runner's working tree is thrown away.
 *   2. `changeset publish-plan` — which of those versions npm has not seen.
 *   3. `npm publish --tag alpha` each of them, directly. `alpha.yml` has its own
 *      trusted publisher on npmjs.com that allows `npm publish`; `release.yml`
 *      keeps the stage-only one, so a stable version still waits for 2FA.
 *
 * No git tags and no GitHub Releases: a snapshot is a build, not a release.
 * `latest` is never touched — only `release.yml` moves it.
 *
 * Every package is attempted even after one fails, and a version npm already
 * serves counts as success, which is what makes a re-run safe.
 */
import { appendFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { findPackageDirs, lastJsonObject, type PublishRelease, parsePublishPlan } from "./changeset-stage";

export type PublishResult =
	| { result: "published" }
	| { result: "already-published" }
	| { result: "failed"; code: string | undefined; message: string };

export type AlphaRow = {
	name: string;
	version: string;
	outcome: PublishResult;
};

/**
 * A changeset waiting to be released is a markdown file at the top of
 * `.changeset/`. The README is not one, and `pre/` holds changesets a pre-mode
 * version already consumed.
 */
export function hasPendingChangesets(entries: readonly string[]): boolean {
	return entries.some((entry) => entry.endsWith(".md") && entry !== "README.md");
}

const ALREADY_PUBLISHED = /previously published|cannot publish over/i;

/** Reads one `npm publish --json` run. Failure is `{ error: { code, summary, detail } }` as the last object on stdout. */
export function parsePublishResult(input: { exitCode: number; stdout: string; stderr: string }): PublishResult {
	if (input.exitCode === 0) return { result: "published" };
	const json = lastJsonObject(input.stdout);
	const error = json && typeof json.error === "object" && json.error !== null ? json.error : undefined;
	const code = error && "code" in error && typeof error.code === "string" ? error.code : undefined;
	const summary = error && "summary" in error && typeof error.summary === "string" ? error.summary : "";
	const detail = error && "detail" in error && typeof error.detail === "string" ? error.detail : "";
	const message = [summary, detail].filter(Boolean).join("\n") || input.stderr || input.stdout || "Unknown error";
	if (ALREADY_PUBLISHED.test(message)) return { result: "already-published" };
	return { result: "failed", code, message };
}

function describe(outcome: PublishResult): string {
	switch (outcome.result) {
		case "published":
			return "published";
		case "already-published":
			return "already on npm from an earlier run";
		case "failed":
			return `**failed** ${outcome.code ?? ""} ${outcome.message.split("\n")[0] ?? ""}`.trim();
	}
}

/** The GitHub step summary: what went out under `alpha`, and how to install it. */
export function formatAlphaSummary(rows: AlphaRow[]): string {
	const installs = rows.filter((row) => row.outcome.result !== "failed").map((row) => `bun add ${row.name}@alpha`);
	return [
		"## Published to npm under `alpha`",
		"",
		"| Package | Version | Outcome |",
		"| --- | --- | --- |",
		...rows.map((row) => `| ${row.name} | ${row.version} | ${describe(row.outcome)} |`),
		"",
		...(installs.length > 0 ? ["```bash", ...installs, "```", ""] : []),
	].join("\n");
}

async function publishPackage(dir: string, release: PublishRelease): Promise<PublishResult> {
	const run = await $`npm publish --access ${release.access} --tag alpha --json`.cwd(dir).nothrow().quiet();
	return parsePublishResult({ exitCode: run.exitCode, stdout: run.stdout.toString(), stderr: run.stderr.toString() });
}

async function main(): Promise<void> {
	const rootDir = process.cwd();
	if (!hasPendingChangesets(await readdir(join(rootDir, ".changeset")))) {
		console.log("No pending changesets; nothing to publish under alpha.");
		return;
	}

	const tmpDir = process.env.RUNNER_TEMP ?? join(rootDir, "node_modules", ".cache");
	const planPath = join(tmpDir, "alpha-publish-plan.json");

	await $`bunx changeset version --snapshot alpha`;
	await $`bunx changeset publish-plan --output ${planPath}`;
	const plan = parsePublishPlan(await Bun.file(planPath).json());
	const dirs = await findPackageDirs(rootDir);

	const rows: AlphaRow[] = [];
	for (const release of plan.flat()) {
		if (release.kind !== "publish") continue;
		const dir = dirs.get(release.name);
		const outcome: PublishResult = dir
			? await publishPackage(dir, release)
			: { result: "failed", code: undefined, message: "not found in any workspace" };
		rows.push({ name: release.name, version: release.version, outcome });
		console.log(`${release.name}@${release.version} (alpha): ${describe(outcome)}`);
	}

	if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, formatAlphaSummary(rows));

	const failed = rows.filter((row) => row.outcome.result === "failed");
	if (failed.length > 0) {
		console.error(`${failed.length} package(s) failed to publish.`);
		process.exit(1);
	}
}

if (import.meta.main) await main();
