import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { x } from "tinyexec";

/**
 * Runs the project's own formatter over the registry's text.
 *
 * A copied file belongs to the project, and a project with a formatter will
 * have run it. After that every line differs from the registry's and a line
 * diff is worthless — so before `update` compares anything, the registry's
 * side is put through the same formatter, with the same config, and the two
 * are compared in the project's own style.
 *
 * The text goes in on stdin with the destination path as its name. That is what
 * makes the project's config and its per-directory overrides apply, and it
 * means nothing is written anywhere to be formatted.
 *
 * Only a formatter the project already has installed is run. Fetching one would
 * be running code nobody asked for, at a version that formats differently from
 * theirs.
 */

export type FormatterKind = "biome" | "prettier";

export type Formatter = {
	kind: FormatterKind;
	/** Absolute path to the binary in the project's `node_modules/.bin`. */
	bin: string;
	/** The directory holding the config, which is where the formatter is run from. */
	cwd: string;
};

/** Formats `content` as though it were the file at `path`. */
export type Format = (content: string, path: string) => Promise<string>;

export const identityFormat: Format = async (content) => content;

const BIOME_CONFIGS = new Set(["biome.json", "biome.jsonc"]);

/**
 * What each formatter is handed. A component's `AGENTS.md` travels with its
 * source and Biome has no Markdown formatter — asked for one it exits non-zero,
 * which is not a failure worth reporting, or a reason to stop formatting the
 * `.tsx` beside it.
 */
const HANDLES: Record<FormatterKind, RegExp> = {
	biome: /\.(?:[cm]?[jt]sx?|jsonc?|css)$/,
	prettier: /\.(?:[cm]?[jt]sx?|jsonc?|css|mdx?)$/,
};
const PRETTIER_CONFIG = /^(\.prettierrc(\.[a-z0-9]+)?|prettier\.config\.[a-z]+)$/;

/**
 * Which formatter a directory configures, from its file names and manifest.
 *
 * Biome first: a project carrying both configs is usually mid-migration to it,
 * and its `biome.json` is the one that is being kept up.
 */
export function formatterIn(names: readonly string[], manifest: { prettier?: unknown } | null): FormatterKind | null {
	if (names.some((name) => BIOME_CONFIGS.has(name))) return "biome";
	if (names.some((name) => PRETTIER_CONFIG.test(name)) || manifest?.prettier !== undefined) return "prettier";
	return null;
}

/**
 * Finds the formatter governing `start`, walking upwards.
 *
 * The nearest config wins, the same rule both formatters apply themselves. The
 * walk stops at the repository root for the reason the config walk does: past
 * it are somebody's other projects.
 */
export async function detectFormatter(start: string): Promise<Formatter | null> {
	let directory = start;

	while (true) {
		const kind = formatterIn(await list(directory), await manifest(directory));

		if (kind) {
			const bin = findBin(directory, kind);
			return bin ? { kind, bin, cwd: directory } : null;
		}

		if (existsSync(join(directory, ".git"))) return null;

		const parent = dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
}

export function formatterArgs(kind: FormatterKind, path: string): string[] {
	return kind === "biome" ? ["format", `--stdin-file-path=${path}`] : ["--stdin-filepath", path];
}

export async function runFormatter(formatter: Formatter, content: string, path: string): Promise<string> {
	const result = await x(formatter.bin, formatterArgs(formatter.kind, path), {
		stdin: content,
		throwOnError: true,
		nodeOptions: { cwd: formatter.cwd },
	});

	return result.stdout;
}

/**
 * A `Format` that never throws.
 *
 * A formatter can fail for reasons that have nothing to do with the update — a
 * config naming a plugin that is not installed, a file it is told to ignore.
 * The text then comes back as it went in, and `onFailure` is told about the
 * first one only: the same broken config fails every file the same way.
 */
export function createFormat(formatter: Formatter | null, onFailure: (error: unknown) => void): Format {
	if (!formatter) return identityFormat;

	let reported = false;
	const cache = new Map<string, Promise<string>>();

	return (content, path) => {
		if (!HANDLES[formatter.kind].test(path)) return Promise.resolve(content);

		const key = `${path}\0${content}`;
		let pending = cache.get(key);

		if (!pending) {
			pending = runFormatter(formatter, content, path).then(
				// An ignored file comes back empty; that is "not formatted", not "now blank".
				(formatted) => (formatted.length > 0 ? formatted : content),
				(error) => {
					if (!reported) onFailure(error);
					reported = true;
					return content;
				}
			);
			cache.set(key, pending);
		}

		return pending;
	};
}

function findBin(from: string, kind: FormatterKind): string | null {
	let directory = from;

	while (true) {
		const candidate = join(directory, "node_modules", ".bin", kind);
		if (existsSync(candidate)) return candidate;

		const parent = dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
}

async function list(directory: string): Promise<string[]> {
	try {
		return await readdir(directory);
	} catch {
		return [];
	}
}

async function manifest(directory: string): Promise<{ prettier?: unknown } | null> {
	try {
		return JSON.parse(await readFile(join(directory, "package.json"), "utf-8")) as { prettier?: unknown };
	} catch {
		return null;
	}
}
