import { contentHash } from "../lock/hash";
import type { LockFile } from "../lock/schema";
import { merge3 } from "../ui/merge";
import { sameModuloFormatting } from "../ui/normalise";

/**
 * Decides what an update means for one file.
 *
 * Three texts and a lock entry. `base` is what the registry served when the
 * file was copied in, `local` is what the project holds, `next` is what the
 * registry serves now. The entry's hash names `base` without needing it, which
 * settles most files with no fetch at all: a local file that still hashes to it
 * was never touched, and a `next` that hashes to it never moved.
 *
 * Only a file changed on both sides needs the base itself, to be merged from.
 *
 * The project's formatter runs over the registry's side before anything is
 * compared, so a file that was only reformatted is seen as untouched, and a
 * merge is between two texts in the same style.
 */

export type FileState =
	/** Nothing to do. `local` already is, or already amounts to, the registry's text. */
	| { state: "current" }
	/** Only the registry moved. `content` is its text, in the project's style. */
	| { state: "upstream"; content: string }
	/** Only the project moved. Its file is kept. */
	| { state: "local" }
	/** Both moved. `content` is the merge; `conflicts` counts the regions left for a person. */
	| { state: "both"; content: string; conflicts: number }
	/** In the item now, and not in the project. */
	| { state: "added"; content: string }
	/** Recorded as copied, and since deleted from the project. Left deleted. */
	| { state: "deleted-locally" }
	/** No longer part of the item. `untouched` is whether the project ever edited it. */
	| { state: "removed-upstream"; onDisk: boolean; untouched: boolean }
	/**
	 * On disk with nothing to merge from: copied before the lock existed, or
	 * recorded against a ref that no longer serves the text it did. `adopt` is
	 * whether it matches the registry closely enough to simply be recorded.
	 */
	| { state: "untracked"; reason: "no-entry" | "base-unavailable"; adopt: boolean };

export type ClassifyInput = {
	local: string | null;
	/** `null` when the item no longer has this file. */
	next: string | null;
	entry: LockFile | undefined;
	/** The text at `entry.ref`, or `null` if it could not be fetched. Checked against the hash here. */
	base: string | null;
	/** The project's formatter, bound to this file's path. */
	format: (content: string) => Promise<string>;
	nextLabel: string;
};

export async function classify(input: ClassifyInput): Promise<FileState> {
	const { entry, format } = input;
	// Compared and merged with `\n` throughout; a CRLF checkout gets its endings back on the way out.
	const crlf = input.local?.includes("\r\n") ?? false;
	const local = input.local === null ? null : lf(input.local);
	const next = input.next === null ? null : lf(input.next);
	const base = input.base !== null && entry && contentHash(input.base) === entry.hash ? lf(input.base) : null;

	if (next === null) return removed(local, entry, base, format);

	if (!entry) {
		if (local === null) return { state: "added", content: next };
		return { state: "untracked", reason: "no-entry", adopt: await sameAfterFormat(next, local, format) };
	}

	if (local === null) return { state: "deleted-locally" };

	const result = await tracked({ local, next, entry, base, format, nextLabel: input.nextLabel });
	return crlf && "content" in result ? { ...result, content: result.content.replaceAll("\n", "\r\n") } : result;
}

/** A file the item no longer has: all that is left to say is whether the project made it its own. */
async function removed(
	local: string | null,
	entry: LockFile | undefined,
	base: string | null,
	format: ClassifyInput["format"]
): Promise<FileState> {
	if (local === null) return { state: "removed-upstream", onDisk: false, untouched: true };

	const untouched =
		(entry !== undefined && contentHash(local) === entry.hash) ||
		(base !== null && (await sameAfterFormat(base, local, format)));

	return { state: "removed-upstream", onDisk: true, untouched };
}

type Tracked = {
	local: string;
	next: string;
	entry: LockFile;
	base: string | null;
	format: ClassifyInput["format"];
	nextLabel: string;
};

/** A file on disk, in the item, with a lock entry — the case the lock exists for. */
async function tracked({ local, next, entry, base, format, nextLabel }: Tracked): Promise<FileState> {
	const registryMoved = contentHash(next) !== entry.hash;

	if (contentHash(local) === entry.hash)
		return registryMoved ? { state: "upstream", content: next } : { state: "current" };

	// Either the registry's text is the base, or the project already holds the
	// registry's new text — the fix applied by hand. Nothing to fetch either way:
	// the only question is whether the file was edited or only reformatted.
	if (await sameAfterFormat(next, local, format)) return { state: "current" };
	if (!registryMoved) return { state: "local" };

	if (base === null) return { state: "untracked", reason: "base-unavailable", adopt: false };

	const formattedBase = await format(base);
	const formattedNext = await format(next);

	if (formattedBase === local) return { state: "upstream", content: formattedNext };
	// Reformatted, by something this CLI could not run. The registry's text is
	// written as it is and their formatter will have it next time it runs.
	if (sameModuloFormatting(base, local)) return { state: "upstream", content: next };

	const merged = merge3({ local, base: formattedBase, next: formattedNext, nextLabel });
	return { state: "both", content: merged.content, conflicts: merged.conflicts };
}

async function sameAfterFormat(
	registry: string,
	local: string,
	format: (content: string) => Promise<string>
): Promise<boolean> {
	if (registry === local) return true;
	if ((await format(registry)) === local) return true;
	return sameModuloFormatting(registry, local);
}

function lf(content: string): string {
	return content.replaceAll("\r\n", "\n");
}
