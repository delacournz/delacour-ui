import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import type { ResolvedConfig } from "../config/resolve";
import { fileKey } from "../lock/lock";
import type { Namespace } from "../registry/namespaces";
import type { LoadedFile, LoadedItem } from "../registry/schema";
import { transformContent } from "../registry/transform";

/**
 * Works out what `add` would write, before it writes any of it.
 *
 * Planning first is what makes the overwrite prompt honest: the user is asked
 * about the files that would actually change, once, rather than interrupted
 * part-way through a copy that has already half-happened. A file whose contents
 * match byte for byte is not a conflict at all — re-running `add button` after
 * an upgrade should be quiet about the eleven files that did not move.
 */

export type PlannedFile = {
	item: string;
	namespace: Namespace;
	/** `<namespace>/<target>` — what the index and the lock both call this file. */
	key: string;
	/** Absolute destination. */
	path: string;
	/** Path relative to the config, for printing. */
	displayPath: string;
	content: string;
	/** What is on disk now, or `null` if nothing is. Kept so `diff` need not read it again. */
	current: string | null;
	exists: boolean;
	/** Already on disk with exactly this content. */
	unchanged: boolean;
};

export function planFiles(items: readonly LoadedItem[], config: ResolvedConfig): Promise<PlannedFile[]> {
	return Promise.all(items.flatMap((item) => item.files.map((file) => planFile(item, file, config))));
}

async function planFile(item: LoadedItem, file: LoadedFile, config: ResolvedConfig): Promise<PlannedFile> {
	const { path, displayPath } = destination(config, file.namespace, file.target);
	const content = transformFile(file.content, path, config);
	const current = await readText(path);

	return {
		item: item.name,
		namespace: file.namespace,
		key: fileKey(file.namespace, file.target),
		path,
		displayPath,
		content,
		current,
		exists: current !== null,
		unchanged: current === content,
	};
}

/** Where a registry file lands in this project, absolutely and as printed. */
export function destination(
	config: ResolvedConfig,
	namespace: Namespace,
	target: string
): { path: string; displayPath: string } {
	const path = join(config.directories[namespace], target);
	return { path, displayPath: toPosix(relative(config.root, path)) };
}

/** A fetched file's text as this project would hold it at `path`: placeholders resolved to its aliases. */
export function transformFile(content: string, path: string, config: ResolvedConfig): string {
	return transformContent(content, {
		fileDirectory: dirname(path),
		directories: config.directories,
		aliases: config.aliases,
	});
}

export async function writeFiles(files: readonly Pick<PlannedFile, "path" | "content">[]): Promise<void> {
	for (const file of files) {
		await mkdir(dirname(file.path), { recursive: true });
		await writeFile(file.path, file.content, "utf-8");
	}
}

/** A file's text, or `null` if there is no file. */
export async function readText(path: string): Promise<string | null> {
	try {
		return await readFile(path, "utf-8");
	} catch {
		return null;
	}
}

function toPosix(path: string): string {
	return sep === "/" ? path : path.split(sep).join("/");
}
