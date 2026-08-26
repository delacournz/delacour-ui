import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import type { ResolvedConfig } from "../config/resolve";
import type { Namespace } from "../registry/namespaces";
import type { RegistryItem } from "../registry/schema";
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
	/** Absolute destination. */
	path: string;
	/** Path relative to the config, for printing. */
	displayPath: string;
	content: string;
	exists: boolean;
	/** Already on disk with exactly this content. */
	unchanged: boolean;
};

export function planFiles(items: readonly RegistryItem[], config: ResolvedConfig): Promise<PlannedFile[]> {
	return Promise.all(items.flatMap((item) => item.files.map((file) => planFile(item, file, config))));
}

async function planFile(
	item: RegistryItem,
	file: RegistryItem["files"][number],
	config: ResolvedConfig
): Promise<PlannedFile> {
	const path = join(config.directories[file.namespace], file.target);
	const content = transformContent(file.content, {
		fileDirectory: dirname(path),
		directories: config.directories,
		aliases: config.aliases,
	});

	const current = await read(path);

	return {
		item: item.name,
		namespace: file.namespace,
		path,
		displayPath: toPosix(relative(config.root, path)),
		content,
		exists: current !== null,
		unchanged: current === content,
	};
}

export async function writeFiles(files: readonly PlannedFile[]): Promise<void> {
	for (const file of files) {
		await mkdir(dirname(file.path), { recursive: true });
		await writeFile(file.path, file.content, "utf-8");
	}
}

async function read(path: string): Promise<string | null> {
	try {
		return await readFile(path, "utf-8");
	} catch {
		return null;
	}
}

function toPosix(path: string): string {
	return sep === "/" ? path : path.split(sep).join("/");
}
