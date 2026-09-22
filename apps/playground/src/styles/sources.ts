import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * The `@source` directives in a Tailwind v4 entry file, resolved to the directory
 * each one starts scanning from.
 *
 * Tailwind generates CSS only for class names it finds in a scanned file, and a
 * `@source` that points at a directory which does not exist is not an error to it:
 * it scans nothing, emits nothing, and the bundle ships without every class that
 * lived only there. That is how the `packages/native-ui` → `packages/react-native-ui`
 * rename cost TestFlight build 5 all of its padding — the folder moved, the
 * directive did not, and no tool said a word.
 *
 * A directive may be a glob (`../**\/*.{ts,tsx}`). Only the static prefix before
 * the first glob character is a directory Tailwind has to be able to open, so that
 * is the part resolved here.
 */
export type SourceRoot = {
	readonly directive: string;
	readonly root: string;
	readonly exists: boolean;
};

const DIRECTIVE = /@source\s+(?:not\s+)?(?:inline\()?["']([^"']+)["']/g;

export function staticPrefix(pattern: string): string {
	const glob = pattern.search(/[*?{}[\]]/);
	if (glob === -1) return pattern.replace(/\/$/, "");
	const prefix = pattern.slice(0, glob);
	return prefix.endsWith("/") ? prefix.slice(0, -1) : dirname(prefix);
}

export function sourceRoots(css: string, cssFile: string): readonly SourceRoot[] {
	const base = dirname(cssFile);
	return [...css.matchAll(DIRECTIVE)].map(([, directive]) => {
		const root = resolve(base, staticPrefix(directive));
		return { directive, root, exists: existsSync(root) };
	});
}
