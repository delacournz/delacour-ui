import * as clack from "@clack/prompts";
import colors from "picocolors";

/**
 * Everything the CLI prints, behind one object.
 *
 * `--silent` and non-interactive runs are the reason. A CLI is scripted as
 * often as it is typed at — in CI, in a `postinstall`, by an agent — and a
 * prompt that blocks forever with nothing on stdout is the worst way to find
 * that out. Routing output and prompts through here means `--yes` can answer
 * every question and `--silent` can drop every line, in one place.
 */

export type Output = {
	silent: boolean;
	/** Whether prompts can be shown at all. False under `--yes`, `--silent`, or a pipe. */
	interactive: boolean;
	intro(message: string): void;
	outro(message: string): void;
	log(message: string): void;
	info(message: string): void;
	success(message: string): void;
	warn(message: string): void;
	error(message: string): void;
	step(message: string): void;
	/** Confirms, or returns `fallback` when there is no one to ask. */
	confirm(message: string, fallback: boolean): Promise<boolean>;
	task<T>(message: string, run: () => Promise<T>): Promise<T>;
};

export type OutputOptions = {
	silent?: boolean;
	yes?: boolean;
};

export function createOutput(options: OutputOptions = {}): Output {
	const silent = options.silent ?? false;
	const interactive = !silent && !options.yes && process.stdout.isTTY === true;

	const write = (line: string) => {
		if (!silent) clack.log.message(line);
	};

	return {
		silent,
		interactive,

		intro(message) {
			if (!silent) clack.intro(colors.bgCyan(colors.black(` ${message} `)));
		},
		outro(message) {
			if (!silent) clack.outro(message);
		},
		log: write,
		info(message) {
			if (!silent) clack.log.info(message);
		},
		success(message) {
			if (!silent) clack.log.success(message);
		},
		warn(message) {
			if (!silent) clack.log.warn(message);
		},
		error(message) {
			// stderr, and emitted even under `--silent`. A silent failure is not a
			// feature, and stdout belongs to `--json` output and to the MCP
			// server's JSON-RPC stream.
			process.stderr.write(`${colors.red("✗")} ${message}\n`);
		},
		step(message) {
			if (!silent) clack.log.step(message);
		},

		async confirm(message, fallback) {
			if (!interactive) return fallback;

			const answer = await clack.confirm({ message, initialValue: fallback });
			if (clack.isCancel(answer)) throw new CancelledError();

			return answer;
		},

		async task(message, run) {
			if (silent) return run();

			const spinner = clack.spinner();
			spinner.start(message);

			try {
				const result = await run();
				spinner.stop(message);
				return result;
			} catch (error) {
				spinner.stop(colors.red(message));
				throw error;
			}
		},
	};
}

export class CancelledError extends Error {
	constructor() {
		super("Cancelled.");
		this.name = "CancelledError";
	}
}

export const style = {
	bold: colors.bold,
	dim: colors.dim,
	cyan: colors.cyan,
	green: colors.green,
	yellow: colors.yellow,
	red: colors.red,
	code: (value: string) => colors.cyan(value),
	path: (value: string) => colors.dim(value),
};
