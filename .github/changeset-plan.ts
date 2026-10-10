/**
 * The first job of `.github/workflows/release.yml`: decide what a commit on
 * `develop` means for the stable line.
 *
 *   - `version` — changesets are pending, so open the release pull request, or
 *     rebuild the one already open on top of this commit.
 *   - `publish` — nothing is pending and a release commit is waiting: build,
 *     move `main`, stage on npm, tag.
 *   - `none` — anything else. A docs-only merge after a release lands here, and
 *     must: publishing from it would fast-forward `main` to a commit no release
 *     was cut from.
 *
 * Two rules keep a release from being versioned twice, which is what a re-run
 * used to do — it checked out the commit the run started on, ran
 * `changeset version` over changesets `develop` had already consumed, and was
 * refused at the push:
 *
 *   - Versioning only happens from `develop`'s tip. A run for a commit `develop`
 *     has moved past is stale; the newer push has its own run.
 *   - A release commit between `main` and this commit is a release that was
 *     versioned and never finished, since `main` only moves when one does. It
 *     is resumed, not versioned again — the stage script counts a version
 *     already staged as success.
 *
 * The commit is the one the run was started for, not `develop`'s tip, so a
 * merge that lands straight after the release pull request cannot hide it.
 */
import { appendFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { hasPendingChangesets } from "./changeset-alpha";

export type ReleaseMode = "version" | "publish" | "none";

/** The release pull request's title and its commit message. `release.yml` passes both to `changesets/action`. */
export const RELEASE_TITLE = "🔖 chore(release): version packages";

const escaped = RELEASE_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RELEASE_SUBJECT = new RegExp(`^${escaped}(?: \\(#\\d+\\))?$`);

/** A squash merge's subject is the pull request title plus ` (#<number>)`. */
export function isReleaseCommit(subject: string): boolean {
	return RELEASE_SUBJECT.test(subject);
}

export type ReleasePlan = { mode: ReleaseMode; reason: string };

/**
 * `unreleased` is the subject of every commit this one has and `main` does not,
 * this one included. `isTip` is whether this commit is still `develop`'s tip.
 */
export function planRelease(input: {
	entries: readonly string[];
	subject: string;
	unreleased: readonly string[];
	isTip: boolean;
}): ReleasePlan {
	if (hasPendingChangesets(input.entries)) {
		if (input.isTip) return { mode: "version", reason: "changesets are pending" };
		return { mode: "none", reason: "changesets are pending, but this commit is no longer develop's tip" };
	}
	if (isReleaseCommit(input.subject)) return { mode: "publish", reason: "this commit is the release commit" };
	if (input.unreleased.some(isReleaseCommit)) {
		return { mode: "publish", reason: "a release commit before this one never reached main" };
	}
	return { mode: "none", reason: "nothing is pending and every release has reached main" };
}

async function main(): Promise<void> {
	const rootDir = process.cwd();
	const entries = await readdir(join(rootDir, ".changeset"));
	const subject = (await $`git log -1 --format=%s`.text()).trim();
	const unreleased = (await $`git log --format=%s origin/main..HEAD`.text()).split("\n").filter(Boolean);
	const head = (await $`git rev-parse HEAD`.text()).trim();
	const tip = (await $`git rev-parse origin/develop`.text()).trim();
	const plan = planRelease({ entries, subject, unreleased, isTip: head === tip });
	console.log(`${subject}\n→ ${plan.mode}: ${plan.reason}`);
	if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `mode=${plan.mode}\n`);
	if (process.env.GITHUB_STEP_SUMMARY) {
		await appendFile(process.env.GITHUB_STEP_SUMMARY, `**${plan.mode}** — ${plan.reason}\n`);
	}
}

if (import.meta.main) await main();
