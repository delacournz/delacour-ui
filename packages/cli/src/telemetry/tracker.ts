import type { RecordedEvent, Telemetry } from "@delacournz/cli-telemetry";
import { findConfig, readConfig } from "../config/resolve";
import { detectProject } from "../project/detect";
import {
	type CommandLike,
	type CommandProperties,
	componentsFor,
	errorKindOf,
	expoMajor,
	flagsSetOnCli,
	type RegistryKind,
	registryKindFor,
} from "./properties";

/**
 * One command's telemetry, from `preAction` to the exit.
 *
 * `begin` runs before the action: it shows the first-run notice and takes a
 * snapshot of what was typed. `finish` runs after, once, with the outcome — it
 * builds the single `command` event, records it and awaits a flush bounded at
 * 1.5 s, so `program.ts` can `process.exit` straight after it without dropping
 * the event. Nothing here throws: telemetry is never the reason a command fails.
 *
 * Two commands are special. `telemetry` is the way to inspect or switch this
 * off, and counting people who use it would be a poor way to treat them. `mcp`
 * is a long-running server that may never return, so it records and flushes at
 * the start instead.
 */

export type Outcome = "success" | "error" | "cancelled";

export const FLUSH_TIMEOUT_MS = 1500;

/** What is learned from the project the command ran in. */
export type ProjectFacts = {
	registry: RegistryKind;
	packageManager: string | null;
	expoSdk: number | null;
};

/** What `begin` reads off the commander action command. */
export type ActionCommand = CommandLike & {
	name(): string;
	args: readonly string[];
	opts(): Record<string, unknown>;
};

export type InspectInput = {
	cwd: string;
	registry?: string;
	ref?: string;
};

export type Finished = {
	outcome: Outcome;
	error?: unknown;
	/** A code the command returned: `doctor` failing, `update` leaving conflict markers. */
	exitCode?: number;
};

export type Tracker = {
	begin(command: ActionCommand): Promise<void>;
	finish(result: Finished): Promise<void>;
};

export type TrackerOptions = {
	telemetry: Telemetry;
	stderr?: (text: string) => void;
	now?: () => number;
	inspect?: (input: InspectInput) => Promise<ProjectFacts>;
};

type Snapshot = {
	command: string;
	args: string[];
	flags: string[];
	input: InspectInput;
	startedAt: number;
};

function text(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * The cheap questions about a project: which registry this run read, which
 * package manager it uses and which Expo SDK. Each answer is already on disk.
 */
export async function inspectProject(input: InspectInput): Promise<ProjectFacts> {
	let configRegistry: string | undefined;
	try {
		const path = findConfig(input.cwd);
		configRegistry = path ? (await readConfig(path)).registry.url : undefined;
	} catch {}

	const registry = registryKindFor({ cwd: input.cwd, registry: input.registry, ref: input.ref, configRegistry });

	try {
		const project = await detectProject(input.cwd);

		return { registry, packageManager: project.packageManager, expoSdk: expoMajor(project.expoVersion) };
	} catch {
		return { registry, packageManager: null, expoSdk: null };
	}
}

export function createTracker(options: TrackerOptions): Tracker {
	const { telemetry } = options;
	const now = options.now ?? Date.now;
	const stderr = options.stderr ?? ((chunk: string) => void process.stderr.write(chunk));
	const inspect = options.inspect ?? inspectProject;
	let snapshot: Snapshot | undefined;

	async function buildEvent(taken: Snapshot, result: Finished): Promise<RecordedEvent> {
		let facts: ProjectFacts;
		try {
			facts = await inspect(taken.input);
		} catch {
			facts = { registry: "official", packageManager: null, expoSdk: null };
		}

		const components = componentsFor(taken.command, taken.args, facts.registry);

		const properties: CommandProperties = {
			command: taken.command,
			flags: taken.flags,
			registry: facts.registry,
			...(components ? { components } : {}),
			...(facts.packageManager ? { packageManager: facts.packageManager } : {}),
			...(facts.expoSdk !== null ? { expoSdk: facts.expoSdk } : {}),
			...(result.error !== undefined ? { errorKind: errorKindOf(result.error) } : {}),
			...(result.exitCode !== undefined ? { exitCode: result.exitCode } : {}),
		};

		return { name: "command", outcome: result.outcome, durationMs: now() - taken.startedAt, properties };
	}

	return {
		async begin(command) {
			try {
				const name = command.name();
				if (name === "telemetry") return;

				const opts = command.opts();

				if (telemetry.shouldShowNotice() && opts.silent !== true) {
					stderr(`\n${telemetry.noticeText}\n`);
					telemetry.markNoticeShown();
				}

				if (!telemetry.enabled) return;

				snapshot = {
					command: name,
					args: [...command.args],
					flags: flagsSetOnCli(command),
					input: { cwd: text(opts.cwd) ?? process.cwd(), registry: text(opts.registry), ref: text(opts.ref) },
					startedAt: now(),
				};

				if (name === "mcp") {
					const taken = snapshot;
					snapshot = undefined;
					telemetry.record(await buildEvent(taken, { outcome: "success" }));
					await telemetry.flush({ timeoutMs: FLUSH_TIMEOUT_MS });
				}
			} catch {}
		},

		async finish(result) {
			try {
				const taken = snapshot;
				snapshot = undefined;
				if (!taken) return;

				telemetry.record(await buildEvent(taken, result));
				await telemetry.flush({ timeoutMs: FLUSH_TIMEOUT_MS });
			} catch {}
		},
	};
}
