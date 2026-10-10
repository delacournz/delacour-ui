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

	return { content: lines.join("\n"), conflicts };
}

/** Whether a file still carries markers from a merge nobody finished. */
export function hasConflictMarkers(content: string): boolean {
	return /^<{7} .*\n[\s\S]*?^={7}\n[\s\S]*?^>{7} /m.test(content);
}
