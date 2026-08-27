import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { z } from "zod";
import type { LoadedItem, RegistryFile, RegistryIndex, RegistryItem } from "./schema";
import { registryIndexSchema, registryItemSchema } from "./schema";
import { filePath, indexPath, itemPath, type RegistrySource, resolveRegistrySource } from "./source";

/**
 * Reads a registry, from GitHub or from a directory.
 *
 * Everything fetched is cached under the user's cache directory and
 * revalidated with an ETag, so a repeated `add` costs a 304 and an `add` on a
 * flaky connection still works from what is already there. A registry read from
 * a local path skips all of it.
 *
 * An item names its files rather than carrying them, so `add` fetches a handful
 * of small documents instead of one large one. They go through the same cache,
 * and the client holds the concurrency limit itself: a caller can ask for every
 * item in a dependency closure at once without deciding how many sockets that
 * should open.
 */

/**
 * How many file documents to have in flight at once.
 *
 * `add --all` names 210 files. Asking GitHub for them simultaneously is how an
 * install trips secondary rate limiting and fails on the machine of whoever has
 * the fastest connection.
 */
const FETCH_CONCURRENCY = 8;

export type RegistryClient = {
	source: RegistrySource;
	getIndex(): Promise<RegistryIndex>;
	getItem(name: string): Promise<RegistryItem>;
	/** The document a `files[]` entry names. */
	getFile(file: RegistryFile): Promise<string>;
	/** An item with every file's document fetched, ready to write from. */
	loadItem(item: RegistryItem): Promise<LoadedItem>;
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
	const offline = options.offline ?? false;
	const items = new Map<string, Promise<RegistryItem>>();
	const files = new Map<string, Promise<string>>();
	const gate = createGate(FETCH_CONCURRENCY);
	let index: Promise<RegistryIndex> | undefined;

	async function readText(path: string): Promise<string> {
		if (source.kind === "local") return readFile(path, "utf-8");
		return fetchDocument(path, cacheDir, offline);
	}

	async function readJson(path: string): Promise<unknown> {
		const body = await readText(path);

		try {
			return JSON.parse(body);
		} catch (cause) {
			throw new RegistryFetchError(path, undefined, cause);
		}
	}

	const client: RegistryClient = {
		source,

		getIndex() {
			index ??= readJson(indexPath(source)).then((raw) => parse(registryIndexSchema, raw, indexPath(source)));
			return index;
		},

		getItem(name) {
			const path = itemPath(source, name);
			let pending = items.get(name);

			if (!pending) {
				pending = readJson(path).then((raw) => parse(registryItemSchema, raw, path));
				items.set(name, pending);
			}

			return pending;
		},

		getFile(file) {
			// Keyed by registry path, not by item: two items naming the same file
			// are naming the same document.
			let pending = files.get(file.path);

			if (!pending) {
				pending = gate(() => readText(filePath(source, file.path)));
				files.set(file.path, pending);
			}

			return pending;
		},

		async loadItem(item) {
			const loaded = await Promise.all(
				item.files.map(async (file) => ({ ...file, content: await client.getFile(file) }))
			);

			return { ...item, files: loaded };
		},
	};

	return client;
}

/**
 * Caps how many tasks run at once, across every caller.
 *
 * The gate lives on the client rather than at each call site so that hydrating
 * twelve items concurrently opens eight sockets rather than ninety-six. A
 * released slot is handed straight to the next waiter instead of being counted
 * back, which is what keeps the ceiling exact when callers arrive while a
 * waiter is still resuming.
 */
function createGate(limit: number): <T>(task: () => Promise<T>) => Promise<T> {
	let active = 0;
	const waiting: (() => void)[] = [];

	return async function run<T>(task: () => Promise<T>): Promise<T> {
		if (active >= limit) await new Promise<void>((resolve) => waiting.push(resolve));
		else active++;

		try {
			return await task();
		} finally {
			const next = waiting.shift();
			if (next) next();
			else active--;
		}
	};
}

/**
 * Validates registry JSON before anything is written from it.
 *
 * This is the trust boundary. A third-party registry is arbitrary JSON from a
 * URL the user typed, and `add` turns `files[].path` into a document it fetches
 * and `files[].target` into a path it writes to — so the schema's traversal
 * checks are guards, not formalities.
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

/** One document, ETag-revalidated. Items and files alike — only the caller knows which. */
async function fetchDocument(url: string, cacheDir: string, offline: boolean): Promise<string> {
	const cachePath = join(cacheDir, `${createHash("sha256").update(url).digest("hex").slice(0, 32)}.json`);
	const cached = await readCache(cachePath);

	if (offline) {
		if (cached) return cached.body;
		throw new RegistryFetchError(url, undefined, new Error("nothing cached and --offline was passed"));
	}

	let response: Response;
	try {
		response = await fetch(url, {
			headers: cached?.etag ? { "if-none-match": cached.etag } : undefined,
		});
	} catch (cause) {
		// Offline or DNS failure. Stale is better than nothing the user can act on.
		if (cached) return cached.body;
		throw new RegistryFetchError(url, undefined, cause);
	}

	if (response.status === 304 && cached) return cached.body;
	if (!response.ok) {
		if (cached && response.status >= 500) return cached.body;
		throw new RegistryFetchError(url, response.status);
	}

	const body = await response.text();
	await writeCache(cachePath, { etag: response.headers.get("etag") ?? undefined, body });

	return body;
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
