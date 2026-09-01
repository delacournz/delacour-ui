import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { convertTheme, parseTheme } from "@delacour/design-system/convert";
import { loadConfig } from "../config/resolve";
import { createOutput, style } from "../ui/output";

/**
 * Brings a web app's theme across.
 *
 * The palette this library paints from is shadcn's, name for name, so a
 * `globals.css` or a tweakcn export is already almost the right file. What it
 * is not is readable: Uniwind takes a theme only from `@variant light` /
 * `@variant dark`, and a literal `.dark { … }` is registered as a *utility
 * class named `dark`* — no error, no warning, and a dark theme that never
 * arrives. This rewrites the wrapper, fills in the tokens shadcn has no name
 * for, and says what could not come across.
 *
 * All of the thinking is in `@delacour/design-system`, which is pure. This is the I/O
 * around it: find the source, find `theme.css`, ask before replacing it.
 */

export type ThemeOptions = {
	cwd: string;
	dryRun?: boolean;
	silent?: boolean;
	yes?: boolean;
};

export async function theme(source: string | undefined, options: ThemeOptions): Promise<void> {
	const output = createOutput(options);
	const css = await readSource(source, options.cwd);
	const result = convertTheme(parseTheme(css));

	// Deliberately before the config is loaded. A dry run writes nothing, so it
	// works from anywhere — including a web repo, where the point is to see what
	// the theme becomes before there is a project to put it in.
	if (options.dryRun) {
		process.stdout.write(result.css);
		report(result, output);
		return;
	}

	const config = await loadConfig(options.cwd);
	const destination = join(config.directories.styles, "theme.css");
	const shown = relative(options.cwd, destination) || destination;

	const replace = await output.confirm(`Replace ${style.path(shown)}?`, true);
	if (!replace) {
		output.info("Nothing written.");
		return;
	}

	await writeFile(destination, result.css, "utf-8");
	output.success(`Wrote ${style.path(shown)}.`);
	report(result, output);
}

/** A path, `-` for stdin, or a URL. */
async function readSource(source: string | undefined, cwd: string): Promise<string> {
	if (source === undefined) {
		throw new Error("Name a theme to read: a CSS file, a URL, or `-` for stdin.");
	}

	if (source === "-") return readStdin();

	if (/^https?:\/\//.test(source)) {
		const response = await fetch(source);
		if (!response.ok) throw new Error(`Could not read ${source} — ${response.status} ${response.statusText}.`);

		return response.text();
	}

	return readFile(isAbsolute(source) ? source : resolve(cwd, source), "utf-8");
}

async function readStdin(): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));

	return Buffer.concat(chunks).toString("utf-8");
}

function report(result: ReturnType<typeof convertTheme>, output: ReturnType<typeof createOutput>): void {
	output.info(`${result.carried.length} tokens carried across.`);

	if (result.derived.length > 0) {
		// Not a shortcoming of the source — shadcn has no name for these, and the
		// components here paint with all of them.
		output.info(
			`${result.derived.length} filled in, derived from tokens the theme does define: ${result.derived
				.map((name) => name.slice(2))
				.join(", ")}.`
		);
	}

	for (const warning of result.warnings) output.warn(warning);
}
