import { hasConflictMarkers } from "../ui/merge";
import type { FileState } from "./classify";
import type { UpdateFile } from "./plan";

/**
 * Turns what an update means for a file into what is done about it.
 *
 * `classify` reads the three texts; this reads the flags. Kept apart so the
 * part that depends on how the command was run — `--prune`, `--force`, an
 * uncommitted change in the way — is a table that can be read top to bottom,
 * and so a dry run and a real one are deciding from the same place.
 */

export type UpdateAction =
	/** Nothing to do. */
	| "current"
	/** The registry's text was written over an untouched file. */
	| "updated"
	/** Both sides moved and were merged without a conflict. */
	| "merged"
	/** Both sides moved, and the file now holds markers to resolve. */
	| "conflict"
	/** A file new to the item was written. */
	| "added"
	/** The project's edit was kept; the registry had nothing new. */
	| "kept"
	/** A file with no lock entry matched the registry and was recorded. */
	| "adopted"
	/** A file the item dropped was removed, under `--prune`. */
	| "deleted"
	/** Left alone, for the reason in `note`. */
	| "skipped";

export type Decision = {
	action: UpdateAction;
	/** Text to write to the file. */
	write?: string;
	/** Delete the file. */
	remove?: boolean;
	/** Record the file in the lock at the ref being updated to. */
	record?: boolean;
	/** Drop the file's lock entry. */
	forget?: boolean;
	/** Why, for the actions that need saying. */
	note?: string;
};

export type DecideOptions = {
	prune: boolean;
	/** Whether this file has changes git has not got, and nobody said to merge into them anyway. */
	unsafe: boolean;
	/**
	 * Write the registry's text over a file that has no lock entry and differs.
	 * Never a flag: it is set only by someone answering the question `update`
	 * asks after a run, because it is the one decision here that drops an edit.
	 */
	replaceUntracked: boolean;
};

export function decide(file: UpdateFile, options: DecideOptions): Decision {
	const { result } = file;

	switch (result.state) {
		case "current":
			return { action: "current", record: true };

		case "upstream":
			return { action: "updated", write: result.content, record: true };

		case "local":
			return { action: "kept", record: true };

		case "added":
			return { action: "added", write: result.content, record: true };

		case "both":
			return decideMerge(file, result, options);

		case "deleted-locally":
			return { action: "skipped", note: "deleted from this project" };

		case "removed-upstream":
			return decideRemoved(result, options);

		case "untracked":
			return decideUntracked(file, result, options);
	}
}

function decideMerge(
	file: UpdateFile,
	result: Extract<FileState, { state: "both" }>,
	options: DecideOptions
): Decision {
	// Merging into a file that already holds markers buries the first conflict
	// inside the second.
	if (file.local !== null && hasConflictMarkers(file.local)) {
		return { action: "skipped", note: "still has conflict markers from an earlier update" };
	}

	if (options.unsafe) return { action: "skipped", note: "has uncommitted changes — commit them, or pass --force" };

	return { action: result.conflicts > 0 ? "conflict" : "merged", write: result.content, record: true };
}

function decideRemoved(result: Extract<FileState, { state: "removed-upstream" }>, options: DecideOptions): Decision {
	if (!result.onDisk) return { action: "current", forget: true };
	if (options.prune && result.untouched) return { action: "deleted", remove: true, forget: true };

	return {
		action: "skipped",
		note: result.untouched
			? "no longer in the registry — --prune deletes it"
			: "no longer in the registry, and edited here",
	};
}

function decideUntracked(
	file: UpdateFile,
	result: Extract<FileState, { state: "untracked" }>,
	options: DecideOptions
): Decision {
	if (result.adopt) return { action: "adopted", record: true };

	if (result.reason === "no-entry" && options.replaceUntracked) {
		if (options.unsafe) return { action: "skipped", note: "has uncommitted changes — commit them, or pass --force" };

		return { action: "updated", write: result.content, record: true };
	}

	return {
		action: "skipped",
		note:
			result.reason === "no-entry"
				? "not in the lock and differs from the registry — pass --base <ref> to merge it"
				: `${file.entry?.ref ?? "its ref"} no longer serves the text it was copied from`,
	};
}
