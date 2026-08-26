import { dirname, relative, resolve, sep } from "node:path";
import { NAMESPACES, type Namespace } from "../registry/namespaces";

/**
 * Wires the copied styles into the app's Tailwind entry.
 *
 * Two things have to happen and only one of them is obvious. The `@import`
 * pulls in the tokens and the theme. The `@source` lines are what make the
 * classes inside the copied components survive a production build: Tailwind
 * scans source text, and a class it never saw is a class it never compiled.
 *
 * The paths are computed from where the files actually landed, which resolves
 * the symlink trap on its own. In a monorepo the components live in a package
 * that Bun links into `node_modules`, and Tailwind's scanner does not follow
 * symlinks — a `@source` pointing at the linked copy silently contributes
 * nothing, and the components render unstyled in release and fine in dev. The
 * comment in `apps/playground/src/styles/global.css` is this bug, already paid
 * for once.
 */

const START = "/* delacour:start — managed by `delacour init`, edit outside this block */";
const END = "/* delacour:end */";

export type StylesBlockContext = {
	/** Absolute path to the app's Tailwind entry. */
	cssPath: string;
	/** Absolute destination directory per namespace. */
	directories: Record<Namespace, string>;
};

/**
 * The managed block: one import for the theme, one source glob per directory
 * holding copied code.
 */
export function buildStylesBlock(context: StylesBlockContext): string {
	const from = dirname(context.cssPath);
	const lines = [START, `@import "${toSpecifier(from, `${context.directories.styles}/index.css`)}";`, ""];

	// Deduplicated because `icons` sits inside `lib` by default, and a nested
	// glob adds nothing but noise to the file.
	const scanned = new Set(
		NAMESPACES.filter((namespace) => namespace !== "styles").map((namespace) => context.directories[namespace])
	);

	for (const directory of [...scanned].sort()) {
		if ([...scanned].some((other) => other !== directory && isInside(directory, other))) continue;
		lines.push(`@source "${toSpecifier(from, directory)}";`);
	}

	lines.push(END);
	return lines.join("\n");
}

export type PatchResult = {
	content: string;
	changed: boolean;
};

/**
 * Writes the block into an existing entry, or creates one.
 *
 * Bounded by markers so a second `init` replaces the block rather than
 * appending a second copy, and so everything a developer adds around it is left
 * alone.
 */
export function patchGlobalCss(existing: string | null, block: string): PatchResult {
	if (existing === null) return { content: `${DEFAULT_ENTRY}\n${block}\n`, changed: true };

	const start = existing.indexOf(START);
	const end = existing.indexOf(END);

	if (start !== -1 && end > start) {
		const content = `${existing.slice(0, start)}${block}${existing.slice(end + END.length)}`;
		return { content, changed: content !== existing };
	}

	const separator = existing.endsWith("\n") ? "" : "\n";
	return { content: `${existing}${separator}\n${block}\n`, changed: true };
}

const DEFAULT_ENTRY = `@import "tailwindcss";
@import "uniwind";

@source "../**/*.{ts,tsx}";
`;

/**
 * The directories a Tailwind entry actually scans.
 *
 * Read back rather than assumed, because this is the check that matters: a
 * `@source` that does not cover where the components landed produces a build
 * with no error and no styles. Only directory sources are returned — a glob
 * like `../**\/*.{ts,tsx}` is reduced to the directory it starts from, which is
 * what decides coverage.
 */
export function parseSources(css: string, cssPath: string): string[] {
	const from = dirname(cssPath);
	const sources: string[] = [];

	for (const match of css.matchAll(/@source\s+(?:not\s+)?["']([^"']+)["']/g)) {
		const value = match[1] as string;
		if (value.startsWith("inline(")) continue;

		const wildcard = value.search(/[*?[]/);
		const directory = wildcard === -1 ? value : value.slice(0, wildcard);
		sources.push(resolve(from, directory));
	}

	return sources;
}

/** Whether any source directory contains `directory`. */
export function isCovered(directory: string, sources: readonly string[]): boolean {
	return sources.some((source) => {
		const suffix = relative(source, directory);
		return suffix === "" || !suffix.startsWith("..");
	});
}

/** A path Tailwind can resolve from the entry file, always POSIX and always relative. */
function toSpecifier(from: string, target: string): string {
	const path = toPosix(relative(from, target));
	return path.startsWith(".") ? path : `./${path}`;
}

function isInside(directory: string, parent: string): boolean {
	const suffix = relative(parent, directory);
	return suffix !== "" && !suffix.startsWith("..");
}

function toPosix(path: string): string {
	return sep === "/" ? path : path.split(sep).join("/");
}
