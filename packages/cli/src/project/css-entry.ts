import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Finds the Tailwind entry an app already has.
 *
 * Creating a second one is the failure this exists to prevent. Metro compiles
 * the file its `cssEntryFile` names and no other; the app imports whichever
 * file its root layout imports. Write a new entry beside an existing one and
 * those become two different files — Tailwind compiles the one with the
 * `@source` globs, the app loads the one without them, and every component
 * renders unstyled with nothing logged.
 *
 * The Metro config wins when it names one, because that is what actually
 * compiles — see `readUniwindPaths`. This is the fallback for a project that
 * has an entry but has not wired Metro to it yet, which is every app that
 * installed Uniwind and stopped there.
 *
 * Shallowest first: an app that ran an older version of this CLI has both
 * `src/global.css` and `src/styles/global.css`, and the one it imports is the
 * one it had first.
 */

const CANDIDATES = [
	"global.css",
	"src/global.css",
	"app/global.css",
	"src/app/global.css",
	"styles/global.css",
	"src/styles/global.css",
	"src/styles/index.css",
];

/** `@import "tailwindcss"`, however it is quoted and whatever follows it. */
const TAILWIND_IMPORT = /@import\s+["']tailwindcss["']/;

export function findTailwindEntry(appRoot: string): string | null {
	for (const candidate of CANDIDATES) {
		const path = join(appRoot, candidate);
		if (!existsSync(path)) continue;

		try {
			if (TAILWIND_IMPORT.test(readFileSync(path, "utf-8"))) return path;
		} catch {
			// Unreadable is the same as absent: the default is still correct.
		}
	}

	return null;
}
