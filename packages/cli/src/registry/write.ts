import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { configSchema } from "../config/schema";
import type { BuildResult } from "./build";
import { registryIndexSchema, registryItemSchema } from "./schema";

/**
 * Writes a built registry to disk.
 *
 * Two layers, and no source. `registry.json` is the index, carrying everything
 * except the file lists, so `add` can resolve a dependency graph in one request.
 * One small JSON per item under `r/` names the files that item is made of —
 * `packages/native-ui/src/components/button/button.tsx`, the library file
 * itself, which is in the same commit and needs no copy here.
 *
 * That is the point. Inlining a component's source into its item JSON — which is
 * what shadcn ships — turns every change into a diff of four-thousand-character
 * escaped strings. Writing the source out under `registry/files/` instead, which
 * is what this used to do, diffs readably but duplicates the library: two
 * hundred files that can only be kept honest by rebuilding and diffing in CI.
 * Naming the library file is both readable and singular.
 *
 * The output is committed to the repository and served straight off
 * `raw.githubusercontent.com`, so there is no registry to host or keep up.
 */

const SCHEMA_BASE = "https://raw.githubusercontent.com/delacournz/delacour-ui/main/registry";

export const ITEM_SCHEMA_URL = `${SCHEMA_BASE}/item.schema.json`;
export const INDEX_SCHEMA_URL = `${SCHEMA_BASE}/index.schema.json`;

export type WriteResult = {
	/** Paths written, relative to `outDir`. */
	written: string[];
	/** Stale items removed — a component deleted upstream must not linger. */
	removed: string[];
};

export async function writeRegistry(outDir: string, result: BuildResult): Promise<WriteResult> {
	const itemsDir = join(outDir, "r");
	await mkdir(itemsDir, { recursive: true });

	const written: string[] = [];

	for (const item of result.items) {
		const path = join(itemsDir, `${item.name}.json`);
		await writeFile(path, stringify({ $schema: ITEM_SCHEMA_URL, ...item, files: item.files.map(trim) }), "utf-8");
		written.push(`r/${item.name}.json`);
	}

	await writeFile(join(outDir, "registry.json"), stringify({ $schema: INDEX_SCHEMA_URL, ...result.index }), "utf-8");
	written.push("registry.json");

	// The `$schema` URLs above have to resolve to something, or an editor opening
	// a `native-components.json` gets a 404 instead of completions.
	for (const [name, schema] of schemas()) {
		await writeFile(join(outDir, name), stringify(schema), "utf-8");
		written.push(name);
	}

	const removed = await sweepItems(itemsDir, new Set(result.items.map((item) => `${item.name}.json`)));

	return { written, removed };
}

/**
 * Drops an empty `rewrites`, which the schema defaults anyway.
 *
 * Most of the library's files import nothing that crosses a directory, so left
 * in it would be four lines of `"rewrites": []` on two thirds of the registry —
 * noise in exactly the document a reader opens to see what `add` will copy.
 */
function trim(file: BuildResult["items"][number]["files"][number]): unknown {
	const { rewrites, ...rest } = file;
	return rewrites.length > 0 ? { ...rest, rewrites } : rest;
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
