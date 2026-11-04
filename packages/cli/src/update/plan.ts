import type { ResolvedConfig } from "../config/resolve";
import { contentHash } from "../lock/hash";
import { lockedFile } from "../lock/lock";
import type { Lock, LockFile } from "../lock/schema";
import type { Format } from "../project/formatter";
import { installedItems } from "../project/installed";
import { destination, planFiles, readText, transformFile } from "../project/write-files";
import { isTest } from "../registry/classify";
import type { RegistryClient } from "../registry/client";
import { isNamespace, type Namespace } from "../registry/namespaces";
import { LIBRARY_PREFIX } from "../registry/prefix";
import { resolveItemGraph } from "../registry/resolve";
import { applyRewrites } from "../registry/rewrite";
import { type LoadedItem, type RegistryIndexEntry, type RegistryItem, withTests } from "../registry/schema";
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
	/**
	 * Dependencies of a held item that the project does not hold and had when it copied the item —
	 * removed on purpose, so not added. `include` adds them.
	 */
	missing: MissingItem[];
	/** Items whose tests were left out because they render a component the project does not hold. */
	testsLeftOut: { item: string; needs: string[] }[];
	/** The items `include` brought in, their new dependencies with them. */
	included: string[];
};

export type MissingItem = { name: string; neededBy: string[] };

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
	/**
	 * Bring every item's tests along. Without it an item's tests are in scope
	 * only when the lock already records one of them — a project that copied
	 * tests keeps them current, and one that did not is not handed any.
	 */
	tests?: boolean;
	/** Items the project does not hold to add anyway — chosen from `missing` by a person. */
	include?: readonly string[];
	/**
	 * The `prefix` the project's files were copied under, when this run renames it. Every lock entry
	 * hashes the old name, so a base is re-derived under it; the new name then arrives as an upstream
	 * change, replacing an untouched copy and merging into an edited one.
	 */
	renamedFrom?: string;
};

export async function planUpdate(input: PlanInput): Promise<UpdatePlan> {
	const { config, lock, target } = input;
	const index = await target.getIndex();
	const byName = new Map(index.items.map((item) => [item.name, item]));
	const clients = new Map<string, RegistryClient>();
	const clientAt = (ref: string) => {
		let client = clients.get(ref);

		if (!client) {
			client = input.baseClient(ref);
			clients.set(ref, client);
		}

		return client;
	};

	const previous = previousConfig(input);
	const held = new Set([...Object.keys(lock.items), ...(await installedItems(index.items, config))]);
	const candidates = input.names.length > 0 ? [...input.names] : [...held];
	const chosen = new Set([...input.names, ...(input.include ?? [])]);
	const allowed = (name: string) => held.has(name) || chosen.has(name);

	// What each held item depended on when it was copied. A dependency it had then and the project
	// does not hold now was removed on purpose — an icon set swapped for another — and stays out; one
	// it gained since is new, and comes with the update.
	const earlier = new Map(
		await Promise.all(
			[...held]
				.filter((name) => byName.has(name))
				.map(async (name) => [name, await dependenciesWhenCopied(lock, name, clientAt)] as const)
		)
	);

	const missing = new Map<string, Set<string>>();
	const testsLeftOut = new Map<string, string[]>();

	// Tests are scoped like files: a suite that renders a component the project does not hold is left
	// out rather than bringing that component in. The test kit is the exception — it is what the suites run on.
	const narrow = <T extends RegistryItem | RegistryIndexEntry>(item: T): T => {
		let scoped = item;

		if (input.tests || hasTests(lock, item.name)) {
			const unheld = (names: readonly string[]) => names.filter((name) => !allowed(name) && name !== TEST_KIT);
			const logic = unheld(item.testRegistryDependencies);
			const render = config.testRunner === "jest" ? unheld(item.renderTestRegistryDependencies) : [];
			const needs = [...new Set([...logic, ...render])].sort();

			if (needs.length > 0) testsLeftOut.set(item.name, needs);
			scoped = withTests(item, config.testRunner, { tests: logic.length === 0, renderTests: render.length === 0 });
		}

		if (!held.has(item.name)) return scoped;

		const before = earlier.get(item.name) ?? null;
		const keep = (dependency: string) =>
			allowed(dependency) || dependency === TEST_KIT || (before !== null && !before.has(dependency));
		const dropped = scoped.registryDependencies.filter((dependency) => !keep(dependency));

		for (const dependency of dropped) {
			const neededBy = missing.get(dependency) ?? new Set<string>();
			neededBy.add(item.name);
			missing.set(dependency, neededBy);
		}

		return { ...scoped, registryDependencies: scoped.registryDependencies.filter(keep) };
	};

	// An item the lock knows and the registry has since dropped is not an unknown
	// name: every file of it is simply no longer upstream.
	const dropped = candidates.filter((name) => !byName.has(name) && lock.items[name] !== undefined);
	const lookup = (name: string) => {
		const entry = byName.get(name);
		return entry && narrow(entry);
	};
	const order = resolveItemGraph(
		candidates.filter((name) => !dropped.includes(name)),
		lookup
	);
	const included = input.include ? resolveItemGraph(input.include, lookup).filter((name) => !held.has(name)) : [];

	const items = await Promise.all(order.map(async (name) => target.loadItem(narrow(await target.getItem(name)))));
	const planned = await planFiles(items, config);

	const present = await Promise.all(
		planned.map(async (file): Promise<UpdateFile> => {
			const recorded = lockedFile(lock, file.item, file.key);
			const assumed = recorded ? null : await assumeBase(file, input, clientAt);
			const entry = recorded ?? assumed?.entry;

			const base =
				assumed?.base ??
				(entry && needsBase(file.current, file.content, entry)
					? await fetchBase(clientAt(entry.ref), file.item, file.key, file.path, config, entry.hash, previous)
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

	return {
		ref: input.ref,
		items,
		files: [...present, ...gone.filter((file) => file !== null)],
		missing: [...missing]
			.filter(([name]) => !order.includes(name))
			.map(([name, neededBy]) => ({ name, neededBy: [...neededBy].sort() }))
			.sort((a, b) => a.name.localeCompare(b.name)),
		testsLeftOut: [...testsLeftOut]
			.map(([item, needs]) => ({ item, needs }))
			.sort((a, b) => a.item.localeCompare(b.item)),
		included,
	};
}

/**
 * The config the copies may have been made under, when it differs from this one's `prefix`: the
 * prefix this run renames away from, or — for one set by hand in `native-components.json` — the
 * library's own. A base fetched under it is used only if it hashes to the lock entry.
 */
function previousConfig(input: PlanInput): ResolvedConfig | undefined {
	const from = input.renamedFrom ?? (input.config.prefix ? LIBRARY_PREFIX : undefined);
	if (from === undefined || from === (input.config.prefix ?? LIBRARY_PREFIX)) return undefined;

	return { ...input.config, prefix: from === LIBRARY_PREFIX ? undefined : from };
}

/** The item the render tests run on, which a project that takes tests gets whether or not it held it. */
const TEST_KIT = "test-kit";

/**
 * The registry dependencies an item had at the ref the project copied it from, or `null` when that
 * cannot be had — no lock entry, the ref gone, offline. `null` is read as "it had them all": an
 * update never adds what it cannot show is new.
 */
async function dependenciesWhenCopied(
	lock: Lock,
	item: string,
	clientAt: (ref: string) => RegistryClient
): Promise<ReadonlySet<string> | null> {
	const ref = Object.values(lock.items[item]?.files ?? {})[0]?.ref;
	if (!ref) return null;

	try {
		return new Set((await clientAt(ref).getItem(item)).registryDependencies);
	} catch {
		return null;
	}
}

/** Whether the project copied any of this item's tests — the lock is the only record of that choice. */
function hasTests(lock: Lock, item: string): boolean {
	return Object.keys(lock.items[item]?.files ?? {}).some(isTest);
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
 *
 * The ref pins the library's text, not what a CLI did to it on the way out. A
 * CLI from before `shipContent` wrote a component's `AGENTS.md` whole, so the
 * same commit served through today's CLI no longer hashes to what that project
 * recorded, and every doc it edited would be skipped. With `hash`, the text as
 * an older CLI served it is offered too, and only a match is returned — the
 * hash is still what decides, so this widens nothing a moved branch could use.
 */
async function fetchBase(
	client: RegistryClient,
	item: string,
	key: string,
	path: string,
	config: ResolvedConfig,
	hash?: string,
	previous?: ResolvedConfig
): Promise<string | null> {
	try {
		const fetched = await client.getItem(item);
		const file = fetched.files.find((candidate) => `${candidate.namespace}/${candidate.target}` === key);
		if (!file) return null;

		const loaded = await client.loadItem({ ...fetched, files: [file] });
		const content = loaded.files[0]?.content;
		if (content === undefined) return null;

		const shipped = transformFile(content, path, config);
		if (hash === undefined || contentHash(shipped) === hash) return shipped;

		// Copied under the prefix this run is renaming away from.
		const renamed = previous ? transformFile(content, path, previous) : null;
		if (renamed !== null && contentHash(renamed) === hash) return renamed;
		if (!file.target.endsWith(".md")) return shipped;

		for (const candidate of previous ? [config, previous] : [config]) {
			const whole = transformFile(applyRewrites(await client.getFile(file), file.rewrites), path, candidate);
			if (contentHash(whole) === hash) return whole;
		}
		return shipped;
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
	const previous = previousConfig(input);
	const base = edited
		? await fetchBase(clientAt(entry.ref), item, key, path, input.config, entry.hash, previous)
		: null;

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
