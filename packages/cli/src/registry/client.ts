import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { z } from "zod";
import type { RegistryIndex, RegistryItem } from "./schema";
import { registryIndexSchema, registryItemSchema } from "./schema";
import { indexPath, itemPath, type RegistrySource, resolveRegistrySource } from "./source";

/**
 * Reads registry JSON, from GitHub or from a directory.
 *
 * Everything fetched is cached under the user's cache directory and
 * revalidated with an ETag, so a repeated `add` costs a 304 and an `add` on a
 * flaky connection still works from what is already there. A registry read from
 * a local path skips all of it.
 */

export type RegistryClient = {
	source: RegistrySource;
	getIndex(): Promise<RegistryIndex>;
	getItem(name: string): Promise<RegistryItem>;
};

export type ClientOptions = {
	cwd: string;
	url?: string;
	ref?: string;
	/** Skip the network entirely and serve what is already cached. */
	offline?: boolean;
	cacheDir?: string;
};

export class RegistryFetchError extends Error {
	constructor(
		readonly url: string,
		readonly status?: number,
		cause?: unknown
	) {
		super(
			status === 404
				? `Not found in the registry: ${url}`
				: `Could not read ${url}${status ? ` (HTTP ${status})` : ""}${cause instanceof Error ? `: ${cause.message}` : ""}`
		);
		this.name = "RegistryFetchError";
	}
}

export function createRegistryClient(options: ClientOptions): RegistryClient {
	const source = resolveRegistrySource(options);
	const cacheDir = options.cacheDir ?? defaultCacheDir(source);
	const items = new Map<string, Promise<RegistryItem>>();
	let index: Promise<RegistryIndex> | undefined;

	async function read(path: string): Promise<unknown> {
		if (source.kind === "local") return JSON.parse(await readFile(path, "utf-8"));
		return fetchJson(path, cacheDir, options.offline ?? false);
	}

	return {
		source,

		getIndex() {
			index ??= read(indexPath(source)).then((raw) => parse(registryIndexSchema, raw, indexPath(source)));
			return index;
		},

		getItem(name) {
			const path = itemPath(source, name);
			let pending = items.get(name);

			if (!pending) {
				pending = read(path).then((raw) => parse(registryItemSchema, raw, path));
				items.set(name, pending);
			}

			return pending;
		},
	};
}

/**
 * Validates registry JSON before anything is written from it.
 *
 * This is the trust boundary. A third-party registry is arbitrary JSON from a
 * URL the user typed, and `add` turns `files[].target` into a path it writes
 * to — so the schema's traversal check is a guard, not a formality.
 */
function parse<S extends z.ZodType>(schema: S, raw: unknown, url: string): z.output<S> {
	const result = schema.safeParse(raw);

	if (!result.success) {
		const issues = result.error.issues.map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
		throw new Error(`${url} is not a valid registry document:\n${issues.join("\n")}`);
	}

	return result.data;
}

type CacheEntry = {
	etag?: string;
	body: string;
};

async function fetchJson(url: string, cacheDir: string, offline: boolean): Promise<unknown> {
	const cachePath = join(cacheDir, `${createHash("sha256").update(url).digest("hex").slice(0, 32)}.json`);
	const cached = await readCache(cachePath);

	if (offline) {
		if (cached) return JSON.parse(cached.body);
		throw new RegistryFetchError(url, undefined, new Error("nothing cached and --offline was passed"));
	}

	let response: Response;
	try {
		response = await fetch(url, {
			headers: cached?.etag ? { "if-none-match": cached.etag } : undefined,
		});
	} catch (cause) {
		// Offline or DNS failure. Stale is better than nothing the user can act on.
		if (cached) return JSON.parse(cached.body);
		throw new RegistryFetchError(url, undefined, cause);
	}

	if (response.status === 304 && cached) return JSON.parse(cached.body);
	if (!response.ok) {
		if (cached && response.status >= 500) return JSON.parse(cached.body);
		throw new RegistryFetchError(url, response.status);
	}

	const body = await response.text();
	await writeCache(cachePath, { etag: response.headers.get("etag") ?? undefined, body });

	try {
		return JSON.parse(body);
	} catch (cause) {
		throw new RegistryFetchError(url, response.status, cause);
	}
}

async function readCache(path: string): Promise<CacheEntry | null> {
	try {
		return JSON.parse(await readFile(path, "utf-8")) as CacheEntry;
	} catch {
		return null;
	}
}

/** A cache that cannot be written is not worth failing an install over. */
async function writeCache(path: string, entry: CacheEntry): Promise<void> {
	try {
		await mkdir(join(path, ".."), { recursive: true });
		await writeFile(path, JSON.stringify(entry), "utf-8");
	} catch {
		return;
	}
}

function defaultCacheDir(source: RegistrySource): string {
	const root = process.env.XDG_CACHE_HOME || join(homedir(), ".cache");
	return join(root, "delacour", createHash("sha256").update(source.base).digest("hex").slice(0, 16));
}
