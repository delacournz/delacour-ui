import { isTest } from "./classify";

/**
 * What a consumer's copy of a library file leaves out, and the check that it
 * left out enough.
 *
 * The library's docs are written for the people who maintain it, in a Bun
 * monorepo with a test beside every pure module. A copied `AGENTS.md` lands in
 * a project on any package manager, without one of those tests — the registry
 * copies them only for `add --tests` (`classifySource`) — so a sentence holding a design rule to
 * `bun test` or to `tokens.test.ts` cites a toolchain and a file its new owner
 * does not have. Two things close that, and both are here:
 *
 * - `shipContent` strips what is maintainer-only from Markdown: an explicit
 *   omit block, and a Files table row naming a file the registry never ships.
 *   It runs in `client.loadItem` after the rewrites, so `add`, `update`, `view`
 *   and the MCP server all receive the same text, and the lock hashes it.
 * - `findUnshippableReferences` is what the builder runs over that text for
 *   every file it ships, Markdown and source alike. A hit fails the build.
 *
 * Pure and dependency-free: the client half is in the published bundle.
 */

/** Opens a maintainer-only span of an `AGENTS.md`. Invisible when the file renders. */
export const OMIT_START = "<!-- registry:omit -->";
/** Closes it. A block never nests and never runs to the end of the file unclosed. */
export const OMIT_END = "<!-- /registry:omit -->";

/** Strips what a consumer's copy of `target` must not carry. Only Markdown changes. */
export function shipContent(target: string, content: string): string {
	if (!target.endsWith(".md")) return content;
	return dropUnshippedRows(dropOmitBlocks(target, content));
}

/**
 * Removes every omit span.
 *
 * A span whose markers each sit on a line of their own is removed with those
 * lines, so a block costs the copy nothing but the blank line either side of
 * it. Anything else is cut exactly, so a sentence can be omitted from the
 * middle of a paragraph.
 *
 * Unbalanced markers throw: a lost closing marker would otherwise swallow the
 * rest of the document without anyone noticing.
 */
function dropOmitBlocks(target: string, content: string): string {
	let output = "";
	let cursor = 0;

	while (cursor <= content.length) {
		const start = content.indexOf(OMIT_START, cursor);
		const strayEnd = content.indexOf(OMIT_END, cursor);

		if (start === -1) {
			if (strayEnd !== -1) throw new Error(`${target}: ${OMIT_END} without a matching ${OMIT_START}`);
			return output + content.slice(cursor);
		}
		if (strayEnd !== -1 && strayEnd < start) {
			throw new Error(`${target}: ${OMIT_END} without a matching ${OMIT_START}`);
		}

		const end = content.indexOf(OMIT_END, start + OMIT_START.length);
		if (end === -1) throw new Error(`${target}: unclosed ${OMIT_START}`);

		const nested = content.indexOf(OMIT_START, start + OMIT_START.length);
		if (nested !== -1 && nested < end) throw new Error(`${target}: ${OMIT_START} inside another omit block`);

		const afterEnd = end + OMIT_END.length;
		const ownLines =
			(start === 0 || content[start - 1] === "\n") && (afterEnd === content.length || content[afterEnd] === "\n");

		output += content.slice(cursor, start);
		cursor = ownLines ? afterEnd + 1 : afterEnd;
	}

	return output;
}

/** `| \`button.variants.test.ts\` | |` — a row whose first cell is one backticked file name. */
const FIRST_CELL = /^\|\s*`([^`]+)`\s*\|/;

/**
 * Drops each table row whose first cell names a file the registry does not
 * ship. The Files table lists the folder as it is here, tests included, and the
 * package's own docs test holds it to that; the copy lists the folder as it
 * lands.
 */
function dropUnshippedRows(content: string): string {
	return content
		.split("\n")
		.filter((line) => {
			const file = FIRST_CELL.exec(line)?.[1];
			return file === undefined || !isTest(file);
		})
		.join("\n");
}

export type UnshippableReference = {
	/** 1-based. */
	line: number;
	match: string;
};

/**
 * A Bun command or the runtime by name, or a file the registry never ships.
 *
 * Longest alternative first, so `bun:test` and `bun add` are reported whole
 * rather than as a bare `bun`. A word boundary on both sides keeps `bundle`
 * and `IconBun` out of it. A glob like `*.test.ts` is not a file name and is
 * not matched.
 */
const UNSHIPPABLE =
	/\bbun:test\b|\bbun (?:test|add|run|install|create|x|pm|link)\b|\bbunx\b|\b[Bb]un\b|[\w./-]+\.(?:test|test-helpers|fixtures|e2e)\.tsx?\b/g;

/** Every reference in `content` a consumer's copy cannot honour. */
export function findUnshippableReferences(content: string): UnshippableReference[] {
	return content.split("\n").flatMap((text, index) =>
		[...text.matchAll(UNSHIPPABLE)].map((match) => ({
			line: index + 1,
			match: match[0],
		}))
	);
}
