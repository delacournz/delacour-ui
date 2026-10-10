import type { ResolvedConfig } from "../config/resolve";
import { contentHash } from "../lock/hash";
import { lockedFile } from "../lock/lock";
import type { Lock, LockFile } from "../lock/schema";
import type { Format } from "../project/formatter";
import { installedItems } from "../project/installed";
import { destination, planFiles, readText, transformFile } from "../project/write-files";
import type { RegistryClient } from "../registry/client";
import { isNamespace, type Namespace } from "../registry/namespaces";
import { resolveItemGraph } from "../registry/resolve";
import type { LoadedItem } from "../registry/schema";
import { classify, type FileState } from "./classify";

/**
 * Works out what an update would do to every file, and does none of it.
 *
 * The plan is the whole decision. `update` applies it, `update --dry-run` and
 * `diff` print it, and the MCP server returns it — one reading of the project,
 * so the command that reports and the command that writes cannot disagree.
 *
 * The registry is read through clients handed in rather than made here. The
 * base of a file lives at the ref its lock entry names, which for a published
 * CLI is a commit on GitHub — and for a test is a second directory, because a
 * registry read from disk has no refs to speak of.
 */

export type UpdateFile = {
	item: string;
	/** `<namespace>/<target>`. */
	key: string;
	/** Absolute destination. */
	path: string;
	/** Relative to the config, for printing. */
	displayPath: string;
	local: string | null;
	/** The registry's text now, as this project would hold it. `null` once the item drops the file. */
	next: string | null;
	/** The registry's text when the file was copied, if it was needed and could be had. */
	base: string | null;
	entry: LockFile | undefined;
	result: FileState;
};

export type UpdatePlan = {
	/** The ref being updated to. */
	ref: string;
	/** Every item in scope that the registry still has, closure included. */
	items: LoadedItem[];
	files: UpdateFile[];
};

export type PlanInput = {
	config: ResolvedConfig;
	lock: Lock;
	/** The items to update. Empty means every one the project holds. */
	names: readonly string[];
	/** The registry at the ref being updated to. */
	target: RegistryClient;
	ref: string;
	/** The registry at another ref, to fetch a base from. */
	baseClient: (ref: string) => RegistryClient;
	format: Format;
	/** The ref to assume for a file the lock has no entry for. */
	baseRef?: string;
};

export async function planUpdate(input: PlanInput): Promise<UpdatePlan> {
	const { config, lock, target } = input;
	const index = await target.getIndex();
	const byName = new Map(index.items.map((item) => [item.name, item]));

	const candidates =
		input.names.length > 0
			? [...input.names]
			: [...new Set([...Object.keys(lock.items), ...(await installedItems(index.items, config))])];

	// An item the lock knows and the registry has since dropped is not an unknown
	// name: every file of it is simply no longer upstream.
	const dropped = candidates.filter((name) => !byName.has(name) && lock.items[name] !== undefined);
	const order = resolveItemGraph(
		candidates.filter((name) => !dropped.includes(name)),
		(name) => byName.get(name)
	);

	const items = await Promise.all(order.map(async (name) => target.loadItem(await target.getItem(name))));
	const planned = await planFiles(items, config);
	const clients = new Map<string, RegistryClient>();
	const clientAt = (ref: string) => {
		let client = clients.get(ref);

		if (!client) {
			client = input.baseClient(ref);
			clients.set(ref, client);
		}

		return client;
	};

	const present = await Promise.all(
		planned.map(async (file): Promise<UpdateFile> => {
			const recorded = lockedFile(lock, file.item, file.key);
			const assumed = recorded ? null : await assumeBase(file, input, clientAt);
			const entry = recorded ?? assumed?.entry;

			const base =
				assumed?.base ??
				(entry && needsBase(file.current, file.content, entry)
					? await fetchBase(clientAt(entry.ref), file.item, file.key, file.path, config)
					: null);

			return {
				item: file.item,
				key: file.key,
				path: file.path,
				displayPath: file.displayPath,
				local: file.current,
				next: file.content,
				base,
				entry,
				result: await classify({
					local: file.current,
					next: file.content,
					entry,
					base,
					format: (content) => input.format(content, file.path),
					nextLabel: `registry@${shortRef(input.ref)}`,
				}),
			};
		})
	);

	const seen = new Set(planned.map((file) => `${file.item}\0${file.key}`));
	const gone = await Promise.all(
		[...order, ...dropped].flatMap((item) =>
			Object.entries(lock.items[item]?.files ?? {})
				.filter(([key]) => !seen.has(`${item}\0${key}`))
				.map(([key, entry]) => removedFile(item, key, entry, input, clientAt))
		)
	);

	return { ref: input.ref, items, files: [...present, ...gone.filter((file) => file !== null)] };
}

/** A commit is shown as git shows it; a branch or a tag is shown whole. */
export function shortRef(ref: string): string {
	return /^[0-9a-f]{40}$/.test(ref) ? ref.slice(0, 7) : ref;
}

/** The base is only fetched for a file both sides have moved — the hash settles every other case. */
function needsBase(local: string | null, next: string, entry: LockFile): boolean {
	return local !== null && contentHash(local) !== entry.hash && contentHash(next) !== entry.hash;
}

/**
 * `--base <ref>`: an entry for a file that has none, taken on the user's word.
 *
 * A project that copied its components before the lock existed has nothing to
 * merge from. Naming the ref they came from supplies it, and from there the
 * file is treated like any other.
 */
async function assumeBase(
	file: { item: string; key: string; path: string; current: string | null },
	input: PlanInput,
	clientAt: (ref: string) => RegistryClient
): Promise<{ entry: LockFile; base: string } | null> {
	if (!input.baseRef || file.current === null) return null;

	const base = await fetchBase(clientAt(input.baseRef), file.item, file.key, file.path, input.config);
	return base === null ? null : { entry: { ref: input.baseRef, hash: contentHash(base) }, base };
}

/**
 * One file of one item as another ref served it, or `null`.
 *
 * Every failure is `null`: the ref is gone, the item did not exist yet, the
 * file was not part of it, the machine is offline with nothing cached. None of
 * them is an error in the update — they all mean there is no base to merge
 * from, and `classify` has an answer for that.
 */
async function fetchBase(
	client: RegistryClient,
	item: string,
	key: string,
	path: string,
	config: ResolvedConfig
): Promise<string | null> {
	try {
		const fetched = await client.getItem(item);
		const file = fetched.files.find((candidate) => `${candidate.namespace}/${candidate.target}` === key);
		if (!file) return null;

		const loaded = await client.loadItem({ ...fetched, files: [file] });
		const content = loaded.files[0]?.content;

		return content === undefined ? null : transformFile(content, path, config);
	} catch {
		return null;
	}
}

async function removedFile(
	item: string,
	key: string,
	entry: LockFile,
	input: PlanInput,
	clientAt: (ref: string) => RegistryClient
): Promise<UpdateFile | null> {
	const parsed = parseKey(key);
	if (!parsed) return null;

	const { path, displayPath } = destination(input.config, parsed.namespace, parsed.target);
	const local = await readText(path);
	const edited = local !== null && contentHash(local) !== entry.hash;
	const base = edited ? await fetchBase(clientAt(entry.ref), item, key, path, input.config) : null;

	return {
		item,
		key,
		path,
		displayPath,
		local,
		next: null,
		base,
		entry,
		result: await classify({
			local,
			next: null,
			entry,
			base,
			format: (content) => input.format(content, path),
			nextLabel: `registry@${shortRef(input.ref)}`,
		}),
	};
}

function parseKey(key: string): { namespace: Namespace; target: string } | null {
	const slash = key.indexOf("/");
	const namespace = key.slice(0, slash);

	return slash > 0 && isNamespace(namespace) ? { namespace, target: key.slice(slash + 1) } : null;
}
