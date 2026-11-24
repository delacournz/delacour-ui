import { diff3Merge } from "node-diff3";

/**
 * A three-way merge of one file, by line.
 *
 * `base` is the text the registry served when the file was copied in, `local`
 * is what the project holds now, and `next` is the registry's text today. A
 * line only one side moved is taken from that side; a region both moved, and
 * moved differently, is written out as a conflict for a person to settle.
 *
 * The markers are git's, because every editor and every agent already knows
 * what to do with them, and because a merge that guessed would be resolving a
 * conflict in code it does not understand.
 */

export type MergeInput = {
	local: string;
	base: string;
	next: string;
	/** What the registry's side of a conflict is called — `registry@abc1234`. */
	nextLabel: string;
};

export type MergeResult = {
	content: string;
	/** Regions written with markers. Zero is a clean merge. */
	conflicts: number;
};

/** `node-diff3` is typed `any` throughout; this is the part of its result that is read. */
type Region = { ok?: string[]; conflict?: { a: string[]; o: string[]; b: string[] } };

export const LOCAL_LABEL = "local";

export function merge3(input: MergeInput): MergeResult {
	const regions = diff3Merge(input.local.split("\n"), input.base.split("\n"), input.next.split("\n"), {
		excludeFalseConflicts: true,
	}) as Region[];

	const lines: string[] = [];
	let conflicts = 0;

	for (const region of regions) {
		if (region.ok) {
			lines.push(...region.ok);
			continue;
		}

		if (!region.conflict) continue;

		conflicts += 1;
		lines.push(
			`<<<<<<< ${LOCAL_LABEL}`,
			...region.conflict.a,
			"=======",
			...region.conflict.b,
			`>>>>>>> ${input.nextLabel}`
		);
	}

	if (conflicts === 0 && doubledAddition(input, lines)) return wholeConflict(input);

	return { content: lines.join("\n"), conflicts };
}

/**
 * Whether a clean merge holds a line both sides added more often than either side does.
 *
 * Line by line, an insertion the project made and the same insertion the registry made a few lines
 * away are two unrelated changes, so both are taken — and a prop both sides added to one
 * destructure became a duplicate parameter, a file that no longer parsed but was reported merged.
 * A line with no word in it (`}`, `);`, a blank) repeats legitimately and is not counted.
 */
function doubledAddition(input: MergeInput, merged: readonly string[]): boolean {
	const base = lineCounts(input.base.split("\n"));
	const local = lineCounts(input.local.split("\n"));
	const next = lineCounts(input.next.split("\n"));
	const result = lineCounts(merged);

	for (const [line, count] of result) {
		const was = base.get(line) ?? 0;
		const ours = local.get(line) ?? 0;
		const theirs = next.get(line) ?? 0;
		if (ours > was && theirs > was && count > Math.max(ours, theirs)) return true;
	}
	return false;
}

function lineCounts(lines: readonly string[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const raw of lines) {
		const line = raw.trim();
		if (!/\w/.test(line)) continue;
		counts.set(line, (counts.get(line) ?? 0) + 1);
	}
	return counts;
}

/** One conflict over everything between the lines `local` and `next` share at either end. */
function wholeConflict(input: MergeInput): MergeResult {
	const local = input.local.split("\n");
	const next = input.next.split("\n");

	let start = 0;
	while (start < local.length && start < next.length && local[start] === next[start]) start++;

	let end = 0;
	while (
		end < local.length - start &&
		end < next.length - start &&
		local[local.length - 1 - end] === next[next.length - 1 - end]
	)
		end++;

	const lines = [
		...local.slice(0, start),
		`<<<<<<< ${LOCAL_LABEL}`,
		...local.slice(start, local.length - end),
		"=======",
		...next.slice(start, next.length - end),
		`>>>>>>> ${input.nextLabel}`,
		...local.slice(local.length - end),
	];

	return { content: lines.join("\n"), conflicts: 1 };
}

/** Whether a file still carries markers from a merge nobody finished. */
export function hasConflictMarkers(content: string): boolean {
	return /^<{7} .*\n[\s\S]*?^={7}\n[\s\S]*?^>{7} /m.test(content);
}
