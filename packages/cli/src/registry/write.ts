import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { configSchema } from "../config/schema";
import type { BuildResult } from "./build";
import { registryIndexSchema, registryItemSchema } from "./schema";

/**
 * Writes a built registry to disk.
 *
 * One JSON blob per item, plus an index that carries everything except file
 * contents. `add button` then costs two small requests — the index to resolve
 * the dependency graph, and the items it actually needs — rather than pulling
 * the whole library down to copy one component.
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
	/** Stale item files removed — a component deleted upstream must not linger. */
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

	await writeFile(join(outDir, "registry.json"), stringify({ $schema: INDEX_SCHEMA_URL, ...result.index }), "utf-8");
	written.push("registry.json");

	// The `$schema` URLs above have to resolve to something, or an editor opening
	// a `delacour.json` gets a 404 instead of completions.
	for (const [name, schema] of schemas()) {
		await writeFile(join(outDir, name), stringify(schema), "utf-8");
		written.push(name);
	}

	const expected = new Set(result.items.map((item) => `${item.name}.json`));
	const removed: string[] = [];

	for (const name of await readdir(itemsDir)) {
		if (!name.endsWith(".json") || expected.has(name)) continue;
		await rm(join(itemsDir, name));
		removed.push(`r/${name}`);
	}

	return { written, removed };
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
