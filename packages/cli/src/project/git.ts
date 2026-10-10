import { dirname } from "node:path";
import { x } from "tinyexec";

/**
 * Whether git holds a copy of a file as it is now.
 *
 * `update` asks before it merges into a file. A merge it gets wrong, or one
 * that leaves conflict markers, is a `git checkout` away from undone — but only
 * if the file was committed first. An uncommitted edit merged over is gone.
 *
 * `null` is "cannot say": no git, or not a repository. That is not the same as
 * clean and callers must not treat it so.
 */
export async function hasUncommittedChanges(path: string): Promise<boolean | null> {
	try {
		const result = await x("git", ["status", "--porcelain", "--", path], { nodeOptions: { cwd: dirname(path) } });
		if (result.exitCode !== 0) return null;

		// Any line at all: modified, staged, or never added.
		return result.stdout.trim().length > 0;
	} catch {
		return null;
	}
}
