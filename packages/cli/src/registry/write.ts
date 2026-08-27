import { mkdir, readdir, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { z } from "zod";
import { configSchema } from "../config/schema";
import type { BuildResult } from "./build";
import { registryIndexSchema, registryItemSchema } from "./schema";

/**
 * Writes a built registry to disk.
 *
 * Three layers. `registry.json` is the index, carrying everything except the
 * file lists, so `add` can resolve a dependency graph in one request. One small
 * JSON per item under `r/` names the files that item is made of. The files
 * themselves live under `files/`, as the `.tsx`, `.ts`, `.css` and `.md` they
 * actually are.
 *
 * That last split is the point. Inlining a component's source into its item
 * JSON — which is what shadcn ships — turns every change to a component into a
 * diff of four-thousand-character escaped strings that no reviewer can read.
 * Written out as files, `files/ui/button/button.tsx` diffs like the TypeScript
 * it is, and the registry stops being a blob that happens to be checked in.
 *
 * The output is committed to the repository and served straight off
 * `raw.githubusercontent.com`, so there is no registry to host or keep up.
 */

const SCHEMA_BASE = "https://raw.githubusercontent.com/delacournz/delacour-ui/main/registry";

export const ITEM_SCHEMA_URL = `${SCHEMA_BASE}/item.schema.json`;
export const INDEX_SCHEMA_URL = `${SCHEMA_BASE}/index.schema.json`;

/** The directory `files[].path` is relative to. Mirrors `registryFilePath`. */
const FILES_DIR = "files";

export type WriteResult = {
	/** Paths written, relative to `outDir`. */
	written: string[];
	/** Stale items and files removed — anything deleted upstream must not linger. */
	removed: string[];
};

export async function writeRegistry(outDir: string, result: BuildResult): Promise<WriteResult> {
	const itemsDir = join(outDir, "r");
	await mkdir(itemsDir, { recursive: true });

	const written: string[] = [];

	for (const item of result.items) {
		const path = join(itemsDir, `${item.name}.json`);
		await writeFile(path, stringify({ $schema: ITEM_SCHEMA_URL, ...item }), "utf-8");
		written.push(`r/${item.name}.json`);
	}

	// Verbatim: this is the file a consumer receives, and the only thing that
	// should ever change it is the source it was canonicalised from. `registry/`
	// is excluded from Biome for the same reason.
	for (const [path, content] of [...result.contents].sort(([a], [b]) => a.localeCompare(b))) {
		const absolute = join(outDir, path);
		await mkdir(dirname(absolute), { recursive: true });
		await writeFile(absolute, content, "utf-8");
		written.push(path);
	}

	await writeFile(join(outDir, "registry.json"), stringify({ $schema: INDEX_SCHEMA_URL, ...result.index }), "utf-8");
	written.push("registry.json");

	// The `$schema` URLs above have to resolve to something, or an editor opening
	// a `native-components.json` gets a 404 instead of completions.
	for (const [name, schema] of schemas()) {
		await writeFile(join(outDir, name), stringify(schema), "utf-8");
		written.push(name);
	}

	const removed = [
		...(await sweepItems(itemsDir, new Set(result.items.map((item) => `${item.name}.json`)))),
		...(await sweepFiles(join(outDir, FILES_DIR), new Set(result.contents.keys()))),
	];

	return { written, removed };
}

/** A component deleted upstream must not linger as a fetchable item. */
async function sweepItems(itemsDir: string, expected: ReadonlySet<string>): Promise<string[]> {
	const removed: string[] = [];

	for (const name of await readdir(itemsDir)) {
		if (!name.endsWith(".json") || expected.has(name)) continue;
		await rm(join(itemsDir, name));
		removed.push(`r/${name}`);
	}

	return removed;
}

/**
 * The same sweep for `files/`, plus the directories a removal empties.
 *
 * Renaming a component otherwise leaves its old folder behind, and because
 * every item still validates, nothing would ever fail — the registry would just
 * quietly grow files no item names.
 */
async function sweepFiles(filesDir: string, expected: ReadonlySet<string>): Promise<string[]> {
	const entries = await readdir(filesDir, { recursive: true, withFileTypes: true }).catch(() => []);
	const removed: string[] = [];

	for (const entry of entries) {
		if (!entry.isFile()) continue;

		const absolute = join(entry.parentPath, entry.name);
		const path = `${FILES_DIR}/${toPosix(relative(filesDir, absolute))}`;
		if (expected.has(path)) continue;

		await rm(absolute);
		removed.push(path);
	}

	// Deepest first, so a directory holding only now-empty directories goes too.
	const directories = entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => join(entry.parentPath, entry.name))
		.sort((a, b) => b.length - a.length);

	for (const directory of directories) await rmdir(directory).catch(() => {});

	return removed;
}

/**
 * JSON Schemas generated from the zod definitions, so editor completions cannot
 * describe a config shape the CLI would then reject.
 *
 * `io: "input"` is what makes them useful: the output types have every default
 * filled in and would mark half the file required.
 */
function schemas(): [string, unknown][] {
	return [
		["config.schema.json", z.toJSONSchema(configSchema, { io: "input" })],
		["item.schema.json", z.toJSONSchema(registryItemSchema, { io: "input" })],
		["index.schema.json", z.toJSONSchema(registryIndexSchema, { io: "input" })],
	];
}

/** Tabs and a trailing newline, matching every other JSON file in the repo. */
function stringify(value: unknown): string {
	return `${JSON.stringify(value, null, "\t")}\n`;
}

function toPosix(path: string): string {
	return sep === "/" ? path : path.split(sep).join("/");
}
