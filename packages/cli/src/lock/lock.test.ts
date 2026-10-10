import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contentHash } from "./hash";
import { EMPTY_LOCK, fileKey, forgetFiles, lockPath, readLock, recordFiles, writeLock } from "./lock";
import { LOCK_FILENAME, lockSchema } from "./schema";

const directories: string[] = [];

async function temp(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "delacour-lock-"));
	directories.push(directory);
	return directory;
}

afterAll(async () => {
	await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("contentHash", () => {
	test("is a prefixed sha256, stable for the same text", () => {
		expect(contentHash("export const a = 1;\n")).toMatch(/^sha256-[0-9a-f]{64}$/);
		expect(contentHash("a")).toBe(contentHash("a"));
		expect(contentHash("a")).not.toBe(contentHash("b"));
	});

	// A Windows checkout with `core.autocrlf` rewrites every line ending, and
	// that is not an edit anyone made.
	test("does not see a line-ending conversion as a change", () => {
		expect(contentHash("a\r\nb\r\n")).toBe(contentHash("a\nb\n"));
	});
});

describe("fileKey", () => {
	test("is the string the index lists a file as", () => {
		expect(fileKey("ui", "button/button.tsx")).toBe("ui/button/button.tsx");
	});
});

describe("recordFiles", () => {
	const button = { item: "button", key: "ui/button/button.tsx", content: "one" };
	const styles = { item: "button", key: "ui/button/button.styles.ts", content: "two" };

	test("records each file under its item, with the ref and the hash of what was written", () => {
		const lock = recordFiles(EMPTY_LOCK, [button], "abc123");

		expect(lock.items.button?.files[button.key]).toEqual({ ref: "abc123", hash: contentHash("one") });
	});

	test("leaves the lock it was given alone", () => {
		recordFiles(EMPTY_LOCK, [button], "abc123");

		expect(EMPTY_LOCK.items).toEqual({});
	});

	test("replaces an entry for the same file and keeps its neighbours", () => {
		const first = recordFiles(EMPTY_LOCK, [button, styles], "old");
		const second = recordFiles(first, [{ ...button, content: "three" }], "new");

		expect(second.items.button?.files[button.key]).toEqual({ ref: "new", hash: contentHash("three") });
		expect(second.items.button?.files[styles.key]?.ref).toBe("old");
	});

	// Sorted so two people adding different components produce a diff that merges.
	test("keeps items and files in sorted order", () => {
		const lock = recordFiles(
			EMPTY_LOCK,
			[{ item: "spinner", key: "ui/spinner/spinner.tsx", content: "s" }, button, styles],
			"ref"
		);

		expect(Object.keys(lock.items)).toEqual(["button", "spinner"]);
		expect(Object.keys(lock.items.button?.files ?? {})).toEqual([styles.key, button.key]);
	});
});

describe("forgetFiles", () => {
	test("drops a file, and the item with its last one", () => {
		const lock = recordFiles(
			EMPTY_LOCK,
			[
				{ item: "button", key: "ui/button/a.ts", content: "a" },
				{ item: "button", key: "ui/button/b.ts", content: "b" },
			],
			"ref"
		);

		const one = forgetFiles(lock, [{ item: "button", key: "ui/button/a.ts" }]);
		expect(Object.keys(one.items.button?.files ?? {})).toEqual(["ui/button/b.ts"]);

		const none = forgetFiles(one, [{ item: "button", key: "ui/button/b.ts" }]);
		expect(none.items).toEqual({});
	});
});

describe("readLock and writeLock", () => {
	test("a project with no lock file has an empty lock", async () => {
		const root = await temp();

		expect(await readLock(root)).toEqual(EMPTY_LOCK);
	});

	test("round-trips, as tab-indented JSON with a trailing newline", async () => {
		const root = await temp();
		const lock = recordFiles(EMPTY_LOCK, [{ item: "button", key: "ui/button/button.tsx", content: "x" }], "ref");

		await writeLock(root, lock);

		const text = await readFile(lockPath(root), "utf-8");
		expect(lockPath(root)).toBe(join(root, LOCK_FILENAME));
		expect(text.endsWith("}\n")).toBe(true);
		expect(text).toContain('\t"version": 1');
		expect(await readLock(root)).toEqual(lock);
	});

	test("says which file is wrong when it does not parse", async () => {
		const root = await temp();
		await writeFile(lockPath(root), "{ nope", "utf-8");

		await expect(readLock(root)).rejects.toThrow(LOCK_FILENAME);
	});

	test("rejects a lock from a version this CLI does not know", () => {
		expect(lockSchema.safeParse({ version: 2, items: {} }).success).toBe(false);
	});
});
