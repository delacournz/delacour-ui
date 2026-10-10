/**
 * The first job of `.github/workflows/release.yml`: decide what a push to
 * `develop` means for the stable line.
 *
 *   - `version` — changesets are pending, so open the release pull request, or
 *     rebuild the one already open on top of this commit.
 *   - `publish` — nothing is pending and this commit is the release pull
 *     request's squash merge, so build, stage on npm, tag, and move `main`.
 *   - `none` — nothing is pending and this is an ordinary merge. A docs-only
 *     merge after a release lands here, and must: publishing from it would
 *     fast-forward `main` to a commit no release was cut from.
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

export function planRelease(input: { entries: readonly string[]; subject: string }): ReleaseMode {
	if (hasPendingChangesets(input.entries)) return "version";
	return isReleaseCommit(input.subject) ? "publish" : "none";
}

async function main(): Promise<void> {
	const rootDir = process.cwd();
	const entries = await readdir(join(rootDir, ".changeset"));
	const subject = (await $`git log -1 --format=%s`.text()).trim();
	const mode = planRelease({ entries, subject });
	console.log(`${subject}\n→ ${mode}`);
	if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `mode=${mode}\n`);
}

if (import.meta.main) await main();
