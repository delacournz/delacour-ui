/**
 * A line diff, for showing what a project has changed in a component.
 *
 * `diff` never merges. The premise of copying source in is that the user owns
 * it, so the only honest thing the CLI can offer is to show what moved
 * upstream and let them decide — an automatic three-way merge would be
 * resolving conflicts in code it does not understand.
 *
 * The registry items are a few hundred lines each, so the quadratic LCS table
 * is cheaper than the dependency a proper Myers implementation would cost.
 */

export type DiffLine = {
	kind: "context" | "added" | "removed";
	text: string;
};

export type DiffHunk = {
	/** 1-based start line in each side. */
	before: number;
	after: number;
	lines: DiffLine[];
};

export function diffLines(before: string, after: string): DiffLine[] {
	const a = before.split("\n");
	const b = after.split("\n");
	const table = lcsTable(a, b);
	const lines: DiffLine[] = [];

	let i = 0;
	let j = 0;

	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			lines.push({ kind: "context", text: a[i] as string });
			i += 1;
			j += 1;
		} else if ((table[i + 1]?.[j] ?? 0) >= (table[i]?.[j + 1] ?? 0)) {
			lines.push({ kind: "removed", text: a[i] as string });
			i += 1;
		} else {
			lines.push({ kind: "added", text: b[j] as string });
			j += 1;
		}
	}

	while (i < a.length) lines.push({ kind: "removed", text: a[i++] as string });
	while (j < b.length) lines.push({ kind: "added", text: b[j++] as string });

	return lines;
}

/**
 * Groups changes into hunks with surrounding context, dropping the long runs of
 * untouched code between them.
 */
export function toHunks(lines: readonly DiffLine[], context = 3): DiffHunk[] {
	const changed = lines.map((line) => line.kind !== "context");
	const keep = lines.map((_, index) => changed.slice(Math.max(0, index - context), index + context + 1).some(Boolean));

	const hunks: DiffHunk[] = [];
	let before = 1;
	let after = 1;
	let current: DiffHunk | null = null;

	lines.forEach((line, index) => {
		if (keep[index]) {
			current ??= { before, after, lines: [] };
			current.lines.push(line);
		} else if (current) {
			hunks.push(current);
			current = null;
		}

		if (line.kind !== "added") before += 1;
		if (line.kind !== "removed") after += 1;
	});

	if (current) hunks.push(current);
	return hunks;
}

export function hasChanges(lines: readonly DiffLine[]): boolean {
	return lines.some((line) => line.kind !== "context");
}

function lcsTable(a: readonly string[], b: readonly string[]): number[][] {
	const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));

	for (let i = a.length - 1; i >= 0; i -= 1) {
		for (let j = b.length - 1; j >= 0; j -= 1) {
			const row = table[i] as number[];
			row[j] = a[i] === b[j] ? (table[i + 1]?.[j + 1] ?? 0) + 1 : Math.max(table[i + 1]?.[j] ?? 0, row[j + 1] ?? 0);
		}
	}

	return table;
}
