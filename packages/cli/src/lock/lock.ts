import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Namespace } from "../registry/namespaces";
import { contentHash } from "./hash";
import { LOCK_FILENAME, LOCK_SCHEMA_URL, type Lock, type LockFile, lockSchema } from "./schema";

/**
 * Reading, writing and amending the lock.
 *
 * Every change returns a new lock rather than editing the one it was given, so
 * a command can plan against the lock it read and write the amended one only
 * once the files it describes are on disk.
 */

export const EMPTY_LOCK: Lock = { version: 1, items: {} };

/** What `recordFiles` needs of a file: whose it is, where it sits, and what was written. */
export type RecordedFile = {
	item: string;
	key: string;
	content: string;
};

/** `<namespace>/<target>` — the string the registry index lists a file as. */
export function fileKey(namespace: Namespace, target: string): string {
	return `${namespace}/${target}`;
}

/** Beside the config, so the nearest-wins walk that finds one finds the other. */
export function lockPath(root: string): string {
	return join(root, LOCK_FILENAME);
}

/** A project that has never recorded anything has an empty lock, not a missing one. */
export async function readLock(root: string): Promise<Lock> {
	const path = lockPath(root);

	let raw: string;
	try {
		raw = await readFile(path, "utf-8");
	} catch {
		return EMPTY_LOCK;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		throw new Error(`${path} is not valid JSON: ${(error as Error).message}`);
	}

	const result = lockSchema.safeParse(parsed);
	if (!result.success) {
		const issues = result.error.issues.map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
		throw new Error(`${path} is not a valid lock file:\n${issues.join("\n")}`);
	}

	const { $schema: _, ...lock } = result.data;
	return lock;
}

/** Tabs and a trailing newline, matching the config beside it. */
export async function writeLock(root: string, lock: Lock): Promise<void> {
	const body = { $schema: LOCK_SCHEMA_URL, version: lock.version, items: lock.items };
	await writeFile(lockPath(root), `${JSON.stringify(body, null, "\t")}\n`, "utf-8");
}

/** The entry for one file, or `undefined` if it was never recorded. */
export function lockedFile(lock: Lock, item: string, key: string): LockFile | undefined {
	return lock.items[item]?.files[key];
}

/**
 * Records files as copied from `ref`.
 *
 * `content` is the registry's text for the file, never what a merge or a
 * formatter left on disk: the hash has to name the base the next update starts
 * from. Items and files come back sorted, so two branches that each add a
 * component produce lock diffs that merge.
 */
export function recordFiles(lock: Lock, files: readonly RecordedFile[], ref: string): Lock {
	const items: Record<string, Record<string, LockFile>> = {};

	for (const [name, item] of Object.entries(lock.items)) items[name] = { ...item.files };

	for (const file of files) {
		items[file.item] ??= {};
		// biome-ignore lint/style/noNonNullAssertion: assigned on the line above
		items[file.item]![file.key] = { ref, hash: contentHash(file.content) };
	}

	return rebuild(items);
}

/** Drops files that are no longer in the project. An item with none left goes with them. */
export function forgetFiles(lock: Lock, files: readonly Pick<RecordedFile, "item" | "key">[]): Lock {
	const items: Record<string, Record<string, LockFile>> = {};

	for (const [name, item] of Object.entries(lock.items)) items[name] = { ...item.files };
	for (const file of files) delete items[file.item]?.[file.key];

	return rebuild(items);
}

function rebuild(items: Record<string, Record<string, LockFile>>): Lock {
	const sorted: Lock["items"] = {};

	for (const name of Object.keys(items).sort()) {
		const files = items[name] ?? {};
		const keys = Object.keys(files).sort();
		if (keys.length === 0) continue;

		sorted[name] = { files: Object.fromEntries(keys.map((key) => [key, files[key] as LockFile])) };
	}

	return { version: 1, items: sorted };
}
