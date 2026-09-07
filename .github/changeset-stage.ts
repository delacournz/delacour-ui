/**
 * The publish half of `.github/workflows/release.yml`, run by `changesets/action`
 * in place of `changeset publish`.
 *
 * `changeset publish` shells out to `npm publish`, and the trusted publisher
 * bound to this workflow on npmjs.com allows `npm stage publish` only — a direct
 * publish comes back `E403 OIDC permission denied for this action`. So this
 * script does what `changeset publish` does, with the one verb swapped:
 *
 *   1. `changeset publish-plan` — which packages are at a version npm has not
 *      seen, in dependency order.
 *   2. `npm stage publish` each of them. Nothing goes live; a maintainer approves
 *      the staged version with 2FA (`npm stage approve <id>`), which is the point.
 *   3. `changeset git-tag` — the tags `changeset publish` would have created,
 *      written to `$CHANGESETS_OUTPUT` so the action pushes them and opens the
 *      GitHub Releases.
 *
 * The dist-tag comes from `.changeset/pre.json` while pre mode is on, not from
 * the plan. Changesets tags a package `latest` when every version it has ever
 * published is a prerelease — true of all three today — and an alpha on
 * `latest` is exactly what `publishConfig.tag` exists to prevent.
 *
 * Every package is attempted even after one fails, so a run leaves the
 * registry in the most complete state it can and reports every problem at
 * once. A version that is already staged counts as success, which is what
 * makes a re-run safe.
 */
import { appendFile, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";

export type PublishRelease = {
	kind: "publish";
	name: string;
	version: string;
	access: "public" | "restricted";
	tag: string;
};

export type TagOnlyRelease = {
	kind: "tag-only";
	name: string;
	version: string;
};

export type Release = PublishRelease | TagOnlyRelease;

export type PreState = {
	mode: "pre" | "exit";
	tag: string;
};

export type StageResult =
	| { result: "staged"; stageId: string }
	| { result: "already-staged" }
	| { result: "failed"; code: string | undefined; message: string };

export type StageRow = {
	name: string;
	version: string;
	tag: string;
	outcome: StageResult;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRelease(value: unknown): value is Release {
	if (!isRecord(value)) return false;
	if (typeof value.name !== "string" || typeof value.version !== "string") return false;
	if (value.kind === "tag-only") return true;
	return (
		value.kind === "publish" &&
		(value.access === "public" || value.access === "restricted") &&
		typeof value.tag === "string"
	);
}

/**
 * Validates the file `changeset publish-plan --output` writes. Throws on any
 * shape it does not recognise rather than staging from a guess.
 */
export function parsePublishPlan(json: unknown): Release[][] {
	if (!isRecord(json)) throw new Error("Publish plan is not an object");
	if (json.version !== 1) throw new Error(`Unsupported publish plan version: ${String(json.version)}`);
	if (!Array.isArray(json.plan)) throw new Error("Publish plan has no plan array");
	return json.plan.map((chunk, index) => {
		if (!Array.isArray(chunk) || !chunk.every(isRelease)) {
			throw new Error(`Publish plan chunk ${index} is malformed`);
		}
		return chunk;
	});
}

export function parsePreState(json: unknown): PreState | null {
	if (!isRecord(json)) return null;
	if ((json.mode !== "pre" && json.mode !== "exit") || typeof json.tag !== "string") return null;
	return { mode: json.mode, tag: json.tag };
}

/**
 * Pre mode wins over the plan. See the file comment for why the plan's own tag
 * cannot be trusted while the packages have only ever shipped prereleases.
 */
export function resolveDistTag(release: PublishRelease, preState: PreState | null): string {
	if (preState?.mode === "pre") return preState.tag;
	return release.tag;
}

/**
 * npm's `--json` output is not clean JSON: notices and warnings share stdout
 * with it. Walk back from the end to the last parseable object, the same way
 * Changesets reads `npm publish`.
 */
export function lastJsonObject(text: string): Record<string, unknown> | null {
	let candidate = text.replace(/[^}]*$/, "");
	while (candidate) {
		candidate = candidate.replace(/[^{]*/, "");
		try {
			const parsed: unknown = JSON.parse(candidate);
			return isRecord(parsed) ? parsed : null;
		} catch {
			candidate = candidate.slice(1);
		}
	}
	return null;
}

const ALREADY_STAGED = /already (?:been )?staged/i;

/**
 * Reads one `npm stage publish --json` run. Success is keyed by package name:
 * `{ "<name>": { id, version, stageId, … } }`; failure is `{ error: { code,
 * summary, detail } }` as the last object on stdout.
 */
export function parseStageResult(input: {
	name: string;
	exitCode: number;
	stdout: string;
	stderr: string;
}): StageResult {
	const json = lastJsonObject(input.stdout);
	if (input.exitCode === 0) {
		const entry = json?.[input.name];
		const stageId = isRecord(entry) && typeof entry.stageId === "string" ? entry.stageId : undefined;
		if (stageId) return { result: "staged", stageId };
		return {
			result: "failed",
			code: undefined,
			message: "npm exited 0 but printed no stageId; refusing to treat that as staged",
		};
	}
	const error = json && isRecord(json.error) ? json.error : undefined;
	const code = typeof error?.code === "string" ? error.code : undefined;
	const summary = typeof error?.summary === "string" ? error.summary : "";
	const detail = typeof error?.detail === "string" ? error.detail : "";
	const message = [summary, detail].filter(Boolean).join("\n") || input.stderr || input.stdout || "Unknown error";
	if (ALREADY_STAGED.test(message)) return { result: "already-staged" };
	return { result: "failed", code, message };
}

function describe(outcome: StageResult): string {
	switch (outcome.result) {
		case "staged":
			return `staged — \`npm stage approve ${outcome.stageId}\``;
		case "already-staged":
			return "already staged from an earlier run";
		case "failed":
			return `**failed** ${outcome.code ?? ""} ${outcome.message.split("\n")[0] ?? ""}`.trim();
	}
}

/**
 * The GitHub step summary: what is waiting for approval and how to approve it.
 */
export function formatSummary(rows: StageRow[]): string {
	const lines = [
		"## Staged for npm",
		"",
		"Nothing is live yet. Review and approve each staged version with 2FA:",
		"",
		"```bash",
		"npm stage list",
		"npm stage view <stage-id>",
		"npm stage approve <stage-id>",
		"```",
		"",
		"| Package | Version | Tag | Outcome |",
		"| --- | --- | --- | --- |",
		...rows.map((row) => `| ${row.name} | ${row.version} | ${row.tag} | ${describe(row.outcome)} |`),
		"",
	];
	return lines.join("\n");
}

/**
 * Bun accepts `workspaces` as a bare array or as `{ packages, catalog }`; this
 * repository uses the object form for its version catalog.
 */
export function workspacePatterns(rootManifest: unknown): string[] {
	const field: unknown = isRecord(rootManifest) ? rootManifest.workspaces : undefined;
	const list: unknown = Array.isArray(field) ? field : isRecord(field) ? field.packages : undefined;
	return Array.isArray(list) ? list.filter((entry): entry is string => typeof entry === "string") : [];
}

/**
 * Package name → directory, from the root `workspaces` globs. Avoids pulling
 * `@manypkg/get-packages` into the root manifest for one lookup.
 */
export async function findPackageDirs(rootDir: string): Promise<Map<string, string>> {
	const patterns = workspacePatterns(JSON.parse(await readFile(join(rootDir, "package.json"), "utf8")));
	const dirs = new Map<string, string>();
	for (const pattern of patterns) {
		const glob = new Bun.Glob(`${pattern}/package.json`);
		for await (const match of glob.scan({ cwd: rootDir, onlyFiles: true })) {
			const manifest: unknown = JSON.parse(await readFile(join(rootDir, match), "utf8"));
			if (isRecord(manifest) && typeof manifest.name === "string") {
				dirs.set(manifest.name, resolve(rootDir, match, ".."));
			}
		}
	}
	return dirs;
}

async function readJsonIfExists(path: string): Promise<unknown> {
	const file = Bun.file(path);
	if (!(await file.exists())) return null;
	return file.json();
}

async function stagePackage(dir: string, release: PublishRelease, tag: string): Promise<StageResult> {
	// An OTP in the environment would make npm try to use it; staging is the
	// step that exists so no OTP is needed here.
	const env = { ...process.env, NPM_CONFIG_OTP: undefined, npm_config_otp: undefined };
	const run = await $`npm stage publish --access ${release.access} --tag ${tag} --json`
		.cwd(dir)
		.env(env)
		.nothrow()
		.quiet();
	return parseStageResult({
		name: release.name,
		exitCode: run.exitCode,
		stdout: run.stdout.toString(),
		stderr: run.stderr.toString(),
	});
}

async function main(): Promise<void> {
	const rootDir = process.cwd();
	const tmpDir = process.env.RUNNER_TEMP ?? join(rootDir, "node_modules", ".cache");
	const planPath = join(tmpDir, "publish-plan.json");

	await $`bunx changeset publish-plan --output ${planPath}`;
	const plan = parsePublishPlan(await Bun.file(planPath).json());
	const preState = parsePreState(await readJsonIfExists(join(rootDir, ".changeset", "pre.json")));
	const dirs = await findPackageDirs(rootDir);

	const releases = plan.flat().filter((release): release is PublishRelease => release.kind === "publish");
	if (releases.length === 0) {
		console.log("No unpublished packages to stage.");
		return;
	}

	const rows: StageRow[] = [];
	for (const release of releases) {
		const dir = dirs.get(release.name);
		const tag = resolveDistTag(release, preState);
		const outcome: StageResult = dir
			? await stagePackage(dir, release, tag)
			: { result: "failed", code: undefined, message: "not found in any workspace" };
		rows.push({ name: release.name, version: release.version, tag, outcome });
		console.log(`${release.name}@${release.version} (${tag}): ${describe(outcome)}`);
	}

	const summary = formatSummary(rows);
	if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);

	const failed = rows.filter((row) => row.outcome.result === "failed");
	if (failed.length > 0) {
		console.error(`${failed.length} package(s) failed to stage; not tagging.`);
		process.exit(1);
	}

	// Writes `git-tag` events to $CHANGESETS_OUTPUT, which `changesets/action`
	// reads to push the tags and create the GitHub Releases.
	await $`bunx changeset git-tag`;
}

if (import.meta.main) await main();
