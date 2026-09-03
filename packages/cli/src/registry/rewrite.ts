/**
 * The import rewrite an item carries for each of its files, and how it is applied.
 *
 * The registry serves `packages/native-ui/src` itself rather than a copy of it,
 * so the canonicalisation that used to be baked into a copied file now travels
 * beside it as data: `../icon` means `@registry/ui/icon` in this file. The
 * builder computes the list (it has the TypeScript compiler and the whole source
 * tree) and asserts that applying it reproduces, byte for byte, the content it
 * canonicalised. The client only replaces strings.
 *
 * That split is what keeps `scan-imports.ts` — and the ten megabytes of
 * `typescript` behind it — out of the published bundle. See rule 1 in AGENTS.md.
 */

export type Rewrite = {
	/** The specifier as the library wrote it — `"../icon"`, `"delacour-react-native-ui/provider"`. */
	from: string;
	/** The placeholder it becomes — `"@registry/ui/icon"`. */
	to: string;
};

/**
 * Two modes, matching what the builder used to do in one pass.
 *
 * A relative specifier is anchored on its surrounding quote or backtick, because
 * `../icon` is a prefix of `../icon-set` and an unanchored replacement would
 * corrupt the second. Anything else is a package subpath, which is replaced
 * everywhere it appears — those are cited in prose as well as imported, and a
 * copied doc that tells its new owner to import from a package they never
 * installed is worse than useless.
 *
 * Longest first among the unanchored ones, so `…/icons/central` is not
 * half-matched by `…/icons`.
 */
export function applyRewrites(content: string, rewrites: readonly Rewrite[]): string {
	let output = content;

	for (const { from, to } of rewrites.filter((rewrite) => isRelative(rewrite.from))) {
		output = output.replace(anchored(from), (_match, delimiter: string) => `${delimiter}${to}${delimiter}`);
	}

	const bare = rewrites.filter((rewrite) => !isRelative(rewrite.from)).sort((a, b) => b.from.length - a.from.length);
	for (const { from, to } of bare) output = output.replaceAll(from, to);

	return output;
}

function isRelative(specifier: string): boolean {
	return specifier.startsWith(".");
}

/** `"../icon"` or `` `../icon` ``, and nothing that merely starts with it. */
function anchored(from: string): RegExp {
	return new RegExp(`(["'\`])${escapePattern(from)}\\1`, "g");
}

function escapePattern(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
