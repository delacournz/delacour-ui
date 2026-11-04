import { rm } from "node:fs/promises";
import * as clack from "@clack/prompts";
import { loadConfig, type ResolvedConfig } from "../config/resolve";
import { forgetFiles, readLock, recordFiles, writeLock } from "../lock/lock";
import type { Lock } from "../lock/schema";
import { detectProject } from "../project/detect";
import { createFormat, detectFormatter, type Format } from "../project/formatter";
import { hasUncommittedChanges } from "../project/git";
import type { DependencyPlan } from "../project/package-manager";
import { findProviderReferences } from "../project/provider-references";
import { destination, writeFiles } from "../project/write-files";
import { createRegistryClient, type RegistryClient } from "../registry/client";
import { isNamespace } from "../registry/namespaces";
import { LIBRARY_PREFIX, providerName } from "../registry/prefix";
import { DEFAULT_REGISTRY_REF } from "../registry/source";
import { createOutput, type Output, style } from "../ui/output";
import { type Decision, decide, type UpdateAction } from "../update/decide";
import { type MissingItem, planUpdate, shortRef, type UpdateFile, type UpdatePlan } from "../update/plan";
import { type ComponentChange, componentChanges, describeChange, onlySelected } from "../update/select";
import { type ChoosePackages, settleDependencies } from "./add";
import { type AskConfig, type ConfigUpgrade, promptConfig, upgradeConfig } from "./config-upgrade";
import { settleRenderTests } from "./render-tests";
import { chooseTests } from "./tests-choice";

/**
 * Brings copied components up to what the registry holds now.
 *
 * A copied file belongs to the project, so there are two histories to respect:
 * the registry's, which may have fixed something, and the project's, which may
 * have changed something. The lock names the text both started from, and that
 * is what lets this tell them apart. A file only the registry moved is
 * replaced. A file only the project moved is left alone. A file both moved is
 * merged, line by line — and where they moved the same line, the file is
 * written with git's conflict markers and the run exits non-zero, because
 * picking a side there would be throwing someone's work away quietly.
 *
 * Nothing is taken from the project that it did not get from the registry: an
 * edit is never overwritten, and a file is only deleted under `--prune`, and
 * only if it was never touched.
 *
 * One case has no answer the lock can give: a file copied before the lock
 * existed, which differs from the registry. The run skips it, and then — with
 * someone to ask — asks what to do about the files it skipped: merge them from
 * a ref the reader names, replace them, or leave them. Whatever they pick is a
 * second pass over the same plan with that answer filled in, so the question
 * changes nothing about how a file is classified or written.
 *
 * Before any of that, `native-components.json` itself is brought up to the
 * shape this CLI writes (`config-upgrade.ts`): the fields it predates are asked
 * about once and its `version` recorded, so an answer applies to this run.
 *
 * The ref it updates to is the one the running CLI was built against, so
 * updating a project means running a newer CLI: `bunx delacour@latest update`.
 */

export type UpdateOptions = {
	cwd: string;
	/** Report what would happen and write nothing. */
	dryRun?: boolean;
	json?: boolean;
	yes?: boolean;
	silent?: boolean;
	/** The ref to merge from for files the lock has no entry for. */
	base?: string;
	/** `false` compares without running the project's formatter. */
	format?: boolean;
	/** Delete untouched files their item no longer has. */
	prune?: boolean;
	/** Merge into files with uncommitted changes. */
	force?: boolean;
	/**
	 * The components a first pass was told to update, carried into the second so it does not ask
	 * again. Not a flag — set from the answer to the component question.
	 */
	selected?: readonly string[];
	/** Components the project does not hold to add anyway. Not a flag — set from the component question. */
	include?: readonly string[];
	/** The prefix the copies were made under, when this run's config answer renames it. Not a flag. */
	renamedFrom?: string;
	/** Leave config fields an older config predates unchosen rather than defaulting them — the MCP server's choice. */
	leaveConfig?: boolean;
	/**
	 * Bring every component's tests along, not only the ones the project already
	 * copied. Unset follows `tests.enabled`; a value overrides it and is saved there.
	 */
	tests?: boolean;
	/** `true` installs, `false` never does, unset asks when there is someone to ask. */
	install?: boolean;
	offline?: boolean;
	ref?: string;
	registry?: string;
	/**
	 * Write the registry's copy over files with no lock entry that differ from it.
	 * Not a flag — set by the answer to the question asked after a run.
	 */
	replaceUntracked?: boolean;
};

export type UpdatedFile = {
	item: string;
	path: string;
	action: UpdateAction;
	note?: string;
};

/** What a run did — or, for a dry run, would do. */
export type UpdateResult = {
	ref: string;
	dryRun: boolean;
	files: UpdatedFile[];
	/** Files whose text changed on disk. */
	written: number;
	/** Files left holding conflict markers. */
	conflicts: number;
	dependencies: DependencyPlan | null;
	installed: boolean;
	/** What became of `native-components.json` itself — see `config-upgrade.ts`. */
	config: ConfigUpgrade;
	/** Components the project's components need but it does not hold, and that were left out — see `plan.ts`. */
	missing: MissingItem[];
	/** Components whose tests were left out, and what those tests render that the project does not hold. */
	testsLeftOut: { item: string; needs: string[] }[];
	/**
	 * A `prefix` chosen this run, renamed through every copy. `references` are the project's own files
	 * that still name the old provider — its code, so listed for the reader to change rather than edited.
	 */
	renamed?: { from: string; to: string; references: string[] };
};

/** What to do with the files a run skipped for having no lock entry. */
export type UntrackedAnswer = { kind: "leave" } | { kind: "merge"; base: string } | { kind: "replace" };

/** The registries an update reads, injected so a test can stand two directories in for two refs. */
export type UpdateClients = {
	target: RegistryClient;
	baseClient: (ref: string) => RegistryClient;
	format?: Format;
	/** Asks about the skipped files, by display path. The prompt, unless a test answers instead. */
	askUntracked?: (files: readonly string[]) => Promise<UntrackedAnswer>;
	/** Asks about the config fields an older `native-components.json` predates. */
	askConfig?: AskConfig;
	/**
	 * Picks the components to update from those with changes, and any missing ones to add. The
	 * prompt, unless a test answers instead.
	 */
	chooseComponents?: (
		changes: readonly ComponentChange[],
		missing: readonly MissingItem[]
	) => Promise<readonly string[] | null>;
	/** Picks which missing packages to install. */
	choosePackages?: ChoosePackages;
};

export async function update(names: string[], options: UpdateOptions, clients?: UpdateClients): Promise<UpdateResult> {
	const output = createOutput({ ...options, silent: options.silent || options.json });
	const config = await upgradeConfig(
		options,
		output,
		clients?.askConfig ?? (output.interactive ? promptConfig : undefined)
	);
	// A prefix answered now, over components already copied, makes this run the rename.
	const renaming = config.kind === "upgraded" && config.answered.includes("prefix");
	const passOptions: UpdateOptions = renaming ? { ...options, renamedFrom: LIBRARY_PREFIX } : options;
	const first = await withRename(await runUpdate(names, passOptions, output, config, clients), passOptions, output);

	const ask = clients?.askUntracked ?? (output.interactive ? promptUntracked : undefined);
	const answered = options.dryRun || options.base !== undefined || options.replaceUntracked;
	if (!ask || answered || first.untracked.length === 0) return first.result;

	const answer = await ask(first.untracked);
	if (answer.kind === "leave") return first.result;

	// Everything the first pass settled is current now, so the second touches only the files asked about.
	const answeredOptions: UpdateOptions =
		answer.kind === "merge" ? { ...passOptions, base: answer.base } : { ...passOptions, replaceUntracked: true };
	const second = await runUpdate(
		names,
		first.selected ? { ...answeredOptions, selected: first.selected } : answeredOptions,
		output,
		config,
		clients
	);

	return combine(first.result, second.result);
}

/** Two passes reported as one run: the second's files, both passes' counts. */
function combine(first: UpdateResult, second: UpdateResult): UpdateResult {
	return {
		...second,
		...(first.renamed ? { renamed: first.renamed } : {}),
		written: first.written + second.written,
		conflicts: first.conflicts + second.conflicts,
		dependencies: second.dependencies ?? first.dependencies,
		installed: first.installed || second.installed,
	};
}

/**
 * After a pass that renamed the prefix: the project's own files still importing the old provider,
 * listed and warned about. Nothing of theirs is edited.
 */
async function withRename<T extends { result: UpdateResult }>(
	pass: T,
	options: UpdateOptions,
	output: Output
): Promise<T> {
	if (options.renamedFrom === undefined || options.dryRun) return pass;

	const config = await loadConfig(options.cwd);
	const to = config.prefix ?? LIBRARY_PREFIX;
	const lock = await readLock(config.root);
	const copied = Object.values(lock.items).flatMap((item) =>
		Object.keys(item.files).flatMap((key) => {
			const slash = key.indexOf("/");
			const namespace = key.slice(0, slash);
			return isNamespace(namespace) ? [destination(config, namespace, key.slice(slash + 1)).path] : [];
		})
	);
	const references = await findProviderReferences(config.root, copied, providerName(undefined));

	if (references.length > 0) {
		output.warn(
			[
				`Renamed ${style.code(providerName(undefined))} to ${style.code(providerName(to))}. These files of yours still use the old name:`,
				...references.map((path) => `  ${style.path(path)}`),
			].join("\n")
		);
	}

	pass.result.renamed = { from: options.renamedFrom, to, references };
	return pass;
}

/** One pass: plan, decide, apply, report. `untracked` is what it skipped for want of a lock entry. */
async function runUpdate(
	names: string[],
	options: UpdateOptions,
	output: Output,
	configUpgrade: ConfigUpgrade,
	clients?: UpdateClients
): Promise<{ result: UpdateResult; untracked: string[]; selected?: string[] }> {
	const { plan, config, lock, ref } = await readPlan(names, options, output, clients);
	// A dry run changes nothing, the saved answer included.
	const tests = await chooseTests(config, options.tests, !options.dryRun);

	const decideAll = (unsafe: ReadonlySet<string>) =>
		plan.files.map((file) => ({
			file,
			decision: decide(file, {
				prune: options.prune ?? false,
				unsafe: unsafe.has(file.path),
				replaceUntracked: options.replaceUntracked ?? false,
			}),
		}));

	// Chosen before the uncommitted-changes question, so it is asked only about what will be written.
	const selected = options.selected
		? new Set(options.selected)
		: await chooseComponents(decideAll(new Set()), plan, names, options, output, clients);
	// A missing component someone ticked is planned again with it in scope, and its own new dependencies with it.
	const adding = selected === null ? [] : plan.missing.map((entry) => entry.name).filter((name) => selected.has(name));
	if (adding.length > 0 && !options.include) {
		const replanned = await readPlan(names, { ...options, include: adding }, output, clients);
		return runUpdate(
			names,
			{ ...options, include: adding, selected: [...(selected ?? []), ...replanned.plan.included] },
			output,
			configUpgrade,
			clients
		);
	}

	const inScope = (item: string) => selected === null || selected.has(item);

	const unsafe = await unsafeToMerge(
		{ ...plan, files: plan.files.filter((file) => inScope(file.item)) },
		options,
		output
	);
	const decided = selected === null ? decideAll(unsafe) : onlySelected(decideAll(unsafe), selected);
	const items = plan.items.filter((item) => inScope(item.name));

	const untracked = decided
		.filter(({ file, decision }) => inScope(file.item) && isUnrecorded(file) && decision.action === "skipped")
		.map(({ file }) => file.displayPath);

	const files = decided.map(({ file, decision }) => ({
		item: file.item,
		path: file.displayPath,
		action: decision.action,
		...(decision.note ? { note: decision.note } : {}),
	}));

	const result: UpdateResult = {
		ref,
		dryRun: options.dryRun ?? false,
		files,
		written: decided.filter(({ decision }) => decision.write !== undefined || decision.remove).length,
		conflicts: files.filter((file) => file.action === "conflict").length,
		dependencies: null,
		installed: false,
		config: configUpgrade,
		missing: plan.missing,
		testsLeftOut: plan.testsLeftOut,
	};

	const chosen = selected === null ? undefined : [...selected];
	if (options.dryRun) return { result: finish(result, options, output), untracked, selected: chosen };

	await apply(decided, config, lock, ref);

	// Whenever the render tests are in play, not only when a file moved: a project
	// whose Jest config lost a key gets it back, and one that is current is untouched.
	const keptKit = lock.items["test-kit"] !== undefined;
	if (tests || keptKit) {
		await settleRenderTests(config, tests ? items : items.filter((item) => item.name === "test-kit"), output);
	}

	// Only when a file moved: a component that did not change needs what it needed before.
	if (decided.some(({ decision }) => decision.write !== undefined)) {
		const project = await detectProject(config.app.resolved.root);
		const settled = await settleDependencies(items, config, project, options, output, clients?.choosePackages);

		result.dependencies = settled.dependencies;
		result.installed = settled.installed;
	}

	return { result: finish(result, options, output), untracked, selected: chosen };
}

/**
 * Which components to update, asked when someone ran `update` with no names at a terminal.
 *
 * Every component with a file to write is listed with what happens to each file and how far the
 * registry moved it, all ticked, so Enter takes everything. Named components were already chosen,
 * and a run with no one to ask — `--yes`, `--json`, CI, MCP — takes every one. `null` means all;
 * Escape is an empty set, so nothing is written.
 */
async function chooseComponents(
	decided: Parameters<typeof componentChanges>[0],
	plan: UpdatePlan,
	names: readonly string[],
	options: UpdateOptions,
	output: Output,
	clients: UpdateClients | undefined
): Promise<Set<string> | null> {
	if (names.length > 0 || options.dryRun) return null;

	const ask = clients?.chooseComponents ?? (output.interactive ? promptComponents : undefined);
	if (!ask) return null;

	const onDisk = new Set(plan.files.filter((file) => file.local !== null).map((file) => file.item));
	const changes = componentChanges(decided, plan.items, onDisk);
	if (changes.length === 0 && plan.missing.length === 0) return null;

	const picked = await ask(changes, plan.missing);
	return new Set(picked ?? []);
}

const VERB: Partial<Record<UpdateAction, string>> = {
	updated: "update",
	added: "add",
	merged: "merge",
	conflict: "conflict",
	deleted: "delete",
};

async function promptComponents(
	changes: readonly ComponentChange[],
	missing: readonly MissingItem[]
): Promise<readonly string[] | null> {
	const width = Math.max(
		0,
		...changes.flatMap((change) => change.files.map((file) => (VERB[file.action] ?? "").length))
	);

	if (changes.length > 0)
		clack.log.message(
			changes
				.map((change) =>
					[
						`${style.code(change.item)}  ${style.dim(describeChange(change))}`,
						...change.files.map(
							(file) =>
								`  ${paint(file.action)((VERB[file.action] ?? file.action).padEnd(width))}  ${file.path}  ${style.dim(`+${file.added} −${file.removed}`)}`
						),
					].join("\n")
				)
				.join("\n\n")
		);

	const picked = await clack.multiselect({
		message: `Update which components? ${style.dim("space toggles · enter confirms · delacour diff <name> shows the lines")}`,
		options: [
			...changes.map((change) => ({ value: change.item, label: change.item, hint: describeChange(change) })),
			...missing.map((entry) => ({
				value: entry.name,
				label: entry.name,
				hint: `not in this project · add it · needed by ${entry.neededBy.join(", ")}`,
			})),
		],
		initialValues: changes.map((change) => change.item),
		required: false,
	});

	return clack.isCancel(picked) ? null : picked;
}

/** On disk, differing from the registry, and with no lock entry to say which side moved. */
function isUnrecorded(file: UpdateFile): boolean {
	return file.result.state === "untracked" && file.result.reason === "no-entry" && !file.result.adopt;
}

/**
 * The question asked after a run that skipped files for having no lock entry.
 *
 * Leaving them is the default and what Escape means: the run before this has
 * already finished, so there is nothing to cancel, only more to decline.
 */
async function promptUntracked(files: readonly string[]): Promise<UntrackedAnswer> {
	const several = files.length !== 1;

	const choice = await clack.select<UntrackedAnswer["kind"]>({
		message: `${files.length} skipped file${several ? "s were" : " was"} copied before the lock existed. Update ${several ? "them" : "it"} now?`,
		initialValue: "leave",
		options: [
			{ value: "leave", label: "No, leave as is" },
			{ value: "merge", label: "Merge", hint: "keeps your edits — needs the ref they were copied from" },
			{ value: "replace", label: "Replace with the registry's copy", hint: "your edits to these files are lost" },
		],
	});

	if (clack.isCancel(choice) || choice === "leave") return { kind: "leave" };
	if (choice === "replace") return { kind: "replace" };

	const base = await clack.text({
		message: "Which ref were they copied from?",
		placeholder: "a commit, tag or branch of the registry",
		validate: (value) => (value?.trim() ? undefined : "A ref is needed to merge from."),
	});

	return clack.isCancel(base) ? { kind: "leave" } : { kind: "merge", base: base.trim() };
}

/** What reading a plan needs of the options — the part `diff` shares. */
export type PlanOptions = Pick<
	UpdateOptions,
	"cwd" | "base" | "format" | "offline" | "ref" | "registry" | "tests" | "include" | "renamedFrom"
>;

/**
 * Reads the project and the registry into a plan.
 *
 * Shared with `diff`, which prints the same plan `update` would apply. Two
 * commands computing it separately is two answers to "what has changed".
 */
export async function readPlan(
	names: readonly string[],
	options: PlanOptions,
	output: Output,
	clients?: UpdateClients
): Promise<{ plan: UpdatePlan; config: ResolvedConfig; lock: Lock; ref: string }> {
	const config = await loadConfig(options.cwd);
	const lock = await readLock(config.root);
	const ref = options.ref || config.registry.ref || DEFAULT_REGISTRY_REF;
	const url = options.registry ?? config.registry.url;

	const open = (at: string) => createRegistryClient({ cwd: options.cwd, url, ref: at, offline: options.offline });
	const format = clients?.format ?? (await projectFormat(config, options, output));

	const plan = await output.task("Comparing with the registry", () =>
		planUpdate({
			config,
			lock,
			names,
			ref,
			target: clients?.target ?? open(ref),
			baseClient: clients?.baseClient ?? open,
			format,
			baseRef: options.base,
			tests: options.tests ?? config.testsEnabled,
			...(options.include ? { include: options.include } : {}),
			...(options.renamedFrom === undefined ? {} : { renamedFrom: options.renamedFrom }),
		})
	);

	return { plan, config, lock, ref };
}

async function apply(
	decided: readonly { file: UpdateFile; decision: Decision }[],
	config: ResolvedConfig,
	lock: Lock,
	ref: string
): Promise<void> {
	await writeFiles(
		decided.flatMap(({ file, decision }) =>
			decision.write === undefined ? [] : [{ path: file.path, content: decision.write }]
		)
	);

	for (const { file, decision } of decided) {
		if (decision.remove) await rm(file.path, { force: true });
	}

	// The registry's text, never the merge: the hash has to name the base the
	// next update starts from.
	const recorded = recordFiles(
		lock,
		decided.flatMap(({ file, decision }) =>
			decision.record && file.next !== null ? [{ item: file.item, key: file.key, content: file.next }] : []
		),
		ref
	);

	const next = forgetFiles(
		recorded,
		decided.filter(({ decision }) => decision.forget).map(({ file }) => file)
	);

	if (JSON.stringify(next) !== JSON.stringify(lock)) await writeLock(config.root, next);
}

/**
 * The files it would be reckless to merge into.
 *
 * Only a merge is at stake, and a replacement someone asked for after the run.
 * Replacing an untouched file loses nothing, and the other outcomes write
 * nothing — but these two rewrite a file somebody edited, and if that edit was
 * never committed there is no way back to it.
 *
 * With someone to ask, they are asked once. With no one, the files are skipped
 * and named, and `--force` is how a script says it means it.
 */
async function unsafeToMerge(plan: UpdatePlan, options: UpdateOptions, output: Output): Promise<Set<string>> {
	if (options.force || options.dryRun) return new Set();

	const verb = options.replaceUntracked ? "replace" : "merge into";
	const merges = plan.files.filter(
		(file) => file.result.state === "both" || (options.replaceUntracked && isUnrecorded(file))
	);
	const states = await Promise.all(merges.map((file) => hasUncommittedChanges(file.path)));
	const dirty = merges.filter((_, index) => states[index] === true);

	if (merges.length > 0 && states.every((state) => state === null)) {
		output.warn("This is not a git repository, so a merge here cannot be undone with git.");
	}

	if (dirty.length === 0) return new Set();
	if (!output.interactive) return new Set(dirty.map((file) => file.path));

	output.warn(
		[
			`These files have uncommitted changes, and the update would ${verb} them:`,
			...dirty.map((file) => `  ${style.path(file.displayPath)}`),
		].join("\n")
	);

	const anyway = await output.confirm(`${verb[0]?.toUpperCase()}${verb.slice(1)} them anyway?`, false);
	return anyway ? new Set() : new Set(dirty.map((file) => file.path));
}

async function projectFormat(config: ResolvedConfig, options: PlanOptions, output: Output): Promise<Format> {
	if (options.format === false) return createFormat(null, () => {});

	const formatter = await detectFormatter(config.root);

	return createFormat(formatter, (error) => {
		output.warn(
			`Could not run ${formatter?.kind} on the registry's files, so they are compared as they are: ${
				error instanceof Error ? (error.message.split("\n")[0] ?? "") : String(error)
			}`
		);
	});
}

const LABELS: Record<UpdateAction, string> = {
	current: "current",
	updated: "updated",
	merged: "merged",
	conflict: "conflict",
	added: "added",
	kept: "kept",
	adopted: "recorded",
	deleted: "deleted",
	skipped: "skipped",
};

function finish(result: UpdateResult, options: UpdateOptions, output: Output): UpdateResult {
	if (options.json) {
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		return result;
	}

	if (output.silent) return result;

	reportLeftOut(result, output);

	const shown = result.files.filter((file) => file.action !== "current" && file.action !== "adopted");
	const quiet = result.files.length - shown.length;
	const at = style.code(shortRef(result.ref));

	if (result.files.length === 0) {
		output.info("No components from the registry are in this project yet.");
		return result;
	}

	if (shown.length === 0) {
		output.success(`Everything matches the registry at ${at}.`);
		return result;
	}

	const width = Math.max(...shown.map((file) => LABELS[file.action].length));

	clack.log.message(
		shown
			.map((file) => {
				const label = paint(file.action)(LABELS[file.action].padEnd(width));
				return `${label}  ${file.path}${file.note ? style.dim(` — ${file.note}`) : ""}`;
			})
			.join("\n")
	);

	const count = (action: UpdateAction) => result.files.filter((file) => file.action === action).length;
	const parts = [
		[count("updated"), "updated"],
		[count("merged"), "merged"],
		[count("added"), "added"],
		[count("deleted"), "deleted"],
		[count("kept"), "kept as edited"],
		[count("skipped"), "skipped"],
		[quiet, "already current"],
	] as const;

	const summary = parts
		.filter(([total]) => total > 0)
		.map(([total, label]) => `${total} ${label}`)
		.join(", ");

	if (result.dryRun) {
		output.info(`Would update to ${at}: ${summary || "nothing to do"}. Nothing was written.`);
		return result;
	}

	output.success(`Updated to ${at}: ${summary || "nothing to do"}.`);

	if (result.conflicts > 0) {
		output.error(
			[
				`${result.conflicts} file${result.conflicts === 1 ? " has" : "s have"} conflicts to resolve:`,
				...result.files.filter((file) => file.action === "conflict").map((file) => `  ${file.path}`),
				"",
				"Each is marked <<<<<<< local … >>>>>>> registry. Keep what you want and delete the markers.",
			].join("\n")
		);
	}

	return result;
}

/**
 * What the update did not bring in. A component that needs one the project does not hold is not a
 * mistake to fix — it is usually a swap the project made — so this is a note with the command, not a warning.
 */
function reportLeftOut(result: UpdateResult, output: Output): void {
	if (result.missing.length > 0) {
		output.info(
			[
				"Not in this project, so not added:",
				...result.missing.map(
					(entry) => `  ${style.code(entry.name)}  ${style.dim(`needed by ${entry.neededBy.join(", ")}`)}`
				),
				`Add one with ${style.code(`delacour add ${result.missing[0]?.name ?? "<name>"}`)} if you want it back.`,
			].join("\n")
		);
	}

	if (result.testsLeftOut.length > 0) {
		output.info(
			[
				"Tests left out — they render components this project does not hold:",
				...result.testsLeftOut.map(
					(entry) => `  ${style.code(entry.item)}  ${style.dim(`needs ${entry.needs.join(", ")}`)}`
				),
			].join("\n")
		);
	}
}

function paint(action: UpdateAction): (text: string) => string {
	if (action === "conflict") return style.red;
	if (action === "skipped" || action === "kept") return style.yellow;
	return style.green;
}
