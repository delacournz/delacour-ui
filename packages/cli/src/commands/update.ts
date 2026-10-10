import { rm } from "node:fs/promises";
import * as clack from "@clack/prompts";
import { loadConfig, type ResolvedConfig } from "../config/resolve";
import { forgetFiles, readLock, recordFiles, writeLock } from "../lock/lock";
import type { Lock } from "../lock/schema";
import { detectProject } from "../project/detect";
import { createFormat, detectFormatter, type Format } from "../project/formatter";
import { hasUncommittedChanges } from "../project/git";
import type { DependencyPlan } from "../project/package-manager";
import { writeFiles } from "../project/write-files";
import { createRegistryClient, type RegistryClient } from "../registry/client";
import { DEFAULT_REGISTRY_REF } from "../registry/source";
import { createOutput, type Output, style } from "../ui/output";
import { type Decision, decide, type UpdateAction } from "../update/decide";
import { planUpdate, shortRef, type UpdateFile, type UpdatePlan } from "../update/plan";
import { settleDependencies } from "./add";

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
	/** `true` installs, `false` never does, unset asks when there is someone to ask. */
	install?: boolean;
	offline?: boolean;
	ref?: string;
	registry?: string;
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
};

/** The registries an update reads, injected so a test can stand two directories in for two refs. */
export type UpdateClients = {
	target: RegistryClient;
	baseClient: (ref: string) => RegistryClient;
	format?: Format;
};

export async function update(names: string[], options: UpdateOptions, clients?: UpdateClients): Promise<UpdateResult> {
	const output = createOutput({ ...options, silent: options.silent || options.json });
	const { plan, config, lock, ref } = await readPlan(names, options, output, clients);

	const unsafe = await unsafeToMerge(plan, options, output);
	const decided = plan.files.map((file) => ({
		file,
		decision: decide(file, { prune: options.prune ?? false, unsafe: unsafe.has(file.path) }),
	}));

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
	};

	if (options.dryRun) return finish(result, options, output);

	await apply(decided, config, lock, ref);

	// Only when a file moved: a component that did not change needs what it needed before.
	if (decided.some(({ decision }) => decision.write !== undefined)) {
		const project = await detectProject(config.app.resolved.root);
		const settled = await settleDependencies(plan.items, config, project, options, output);

		result.dependencies = settled.dependencies;
		result.installed = settled.installed;
	}

	return finish(result, options, output);
}

/** What reading a plan needs of the options — the part `diff` shares. */
export type PlanOptions = Pick<UpdateOptions, "cwd" | "base" | "format" | "offline" | "ref" | "registry">;

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
 * Only a merge is at stake. Replacing an untouched file loses nothing, and the
 * other outcomes write nothing — but a merge rewrites a file somebody edited,
 * and if that edit was never committed there is no way back to it.
 *
 * With someone to ask, they are asked once. With no one, the files are skipped
 * and named, and `--force` is how a script says it means it.
 */
async function unsafeToMerge(plan: UpdatePlan, options: UpdateOptions, output: Output): Promise<Set<string>> {
	if (options.force || options.dryRun) return new Set();

	const merges = plan.files.filter((file) => file.result.state === "both");
	const states = await Promise.all(merges.map((file) => hasUncommittedChanges(file.path)));
	const dirty = merges.filter((_, index) => states[index] === true);

	if (merges.length > 0 && states.every((state) => state === null)) {
		output.warn("This is not a git repository, so a merge here cannot be undone with git.");
	}

	if (dirty.length === 0) return new Set();
	if (!output.interactive) return new Set(dirty.map((file) => file.path));

	output.warn(
		[
			"These files have uncommitted changes, and the update would merge into them:",
			...dirty.map((file) => `  ${style.path(file.displayPath)}`),
		].join("\n")
	);

	return (await output.confirm("Merge into them anyway?", false)) ? new Set() : new Set(dirty.map((file) => file.path));
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

function paint(action: UpdateAction): (text: string) => string {
	if (action === "conflict") return style.red;
	if (action === "skipped" || action === "kept") return style.yellow;
	return style.green;
}
