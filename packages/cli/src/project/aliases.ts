import { relative, resolve, sep } from "node:path";
import type { Namespace } from "../registry/namespaces";
import { NAMESPACES } from "../registry/namespaces";

/**
 * Works out what a project's own path aliases call a directory.
 *
 * The CLI reads `tsconfig.json` for this and never writes to it. A project that
 * has `@/*` gets aliased imports; one that does not gets relative ones, which
 * resolve the same in Metro without depending on
 * `experiments.tsconfigPaths` being on. Editing someone's `tsconfig` to create
 * an alias they did not ask for would be a larger change than the imports it
 * saves — and it is the kind of change that silently breaks a monorepo where
 * the same alias already means something else.
 */

export type PathMapping = {
	/** The alias without its wildcard: `@/` from `"@/*"`. */
	prefix: string;
	/** Absolute directory it maps to. */
	directory: string;
};

/**
 * Reads `compilerOptions.paths` into directory mappings.
 *
 * Only wildcard mappings are usable. A project may also pin an exact module —
 * this repo's playground pins `react-native` to one copy — and those name a
 * single file rather than a directory to reach through.
 */
export function parsePathMappings(
	paths: Record<string, string[]> | undefined,
	tsconfigDir: string,
	baseUrl = "."
): PathMapping[] {
	const base = resolve(tsconfigDir, baseUrl);
	const mappings: PathMapping[] = [];

	for (const [pattern, targets] of Object.entries(paths ?? {})) {
		if (!pattern.endsWith("/*")) continue;

		const target = targets.find((candidate) => candidate.endsWith("/*"));
		if (!target) continue;

		mappings.push({
			prefix: pattern.slice(0, -1),
			directory: resolve(base, target.slice(0, -2)),
		});
	}

	return mappings;
}

/**
 * The import specifier for a directory, or `null` when no alias covers it.
 *
 * Longest match wins: a project with both `@/*` and `@ui/*` should get the one
 * that names the directory most closely, not whichever came first.
 */
export function aliasFor(directory: string, mappings: readonly PathMapping[]): string | null {
	const candidates = [...mappings].sort((a, b) => b.directory.length - a.directory.length);

	for (const mapping of candidates) {
		const suffix = relative(mapping.directory, directory);
		if (suffix.startsWith("..")) continue;

		const trimmed = mapping.prefix.replace(/\/+$/, "");
		return suffix === "" ? trimmed : `${trimmed}/${toPosix(suffix)}`;
	}

	return null;
}

/** The alias for each namespace's directory, omitting the ones nothing covers. */
export function aliasesForDirectories(
	directories: Record<Namespace, string>,
	mappings: readonly PathMapping[]
): Partial<Record<Namespace, string>> {
	const aliases: Partial<Record<Namespace, string>> = {};

	for (const namespace of NAMESPACES) {
		const alias = aliasFor(directories[namespace], mappings);
		if (alias) aliases[namespace] = alias;
	}

	return aliases;
}

function toPosix(path: string): string {
	return sep === "/" ? path : path.split(sep).join("/");
}
