import { diffLines } from "../ui/diff";
import type { Decision, UpdateAction } from "./decide";
import type { UpdateFile } from "./plan";

/**
 * Which components an update would change, and how — so someone can choose which to take.
 *
 * `update` with no names at a terminal asks with this before it writes anything: every
 * component with a file to write, what happens to each file, and how far the registry moved it.
 * A component left out is reported as skipped and never recorded in the lock, so the next
 * `update` offers it again. Pure: the plan in, the choices and a narrowed plan out.
 */

type Decided = { file: UpdateFile; decision: Decision };

/** The actions that write or delete something — what a choice is about. */
const CHANGES: ReadonlySet<UpdateAction> = new Set(["updated", "merged", "conflict", "added", "deleted"]);

export type FileChange = {
	path: string;
	action: UpdateAction;
	/** Lines the registry added and removed in this file, base to new. */
	added: number;
	removed: number;
};

export type ComponentChange = {
	item: string;
	files: FileChange[];
	/** Not in this project yet: a dependency an updated component now needs. */
	isNew: boolean;
	/** The components in the plan that depend on this one. */
	neededBy: string[];
	/** A file the project edited is being merged into, or holds a conflict. */
	edited: boolean;
};

type ItemDependencies = { name: string; registryDependencies?: readonly string[] };

export function componentChanges(
	decided: readonly Decided[],
	items: readonly ItemDependencies[],
	installed: ReadonlySet<string>
): ComponentChange[] {
	const changes = new Map<string, ComponentChange>();

	for (const { file, decision } of decided) {
		if (!CHANGES.has(decision.action)) continue;

		const change = changes.get(file.item) ?? {
			item: file.item,
			files: [],
			isNew: !installed.has(file.item),
			neededBy: items
				.filter((item) => item.registryDependencies?.includes(file.item))
				.map((item) => item.name)
				.sort(),
			edited: false,
		};

		change.files.push({ path: file.displayPath, action: decision.action, ...lineCounts(file) });
		if (decision.action === "merged" || decision.action === "conflict") change.edited = true;
		changes.set(file.item, change);
	}

	return [...changes.values()];
}

/** How far the registry moved a file: from the text it was copied as (or the file, if untouched) to the new one. */
function lineCounts(file: UpdateFile): { added: number; removed: number } {
	const before = file.base ?? file.local ?? "";
	const after = file.next ?? "";
	const lines = diffLines(before, after);

	return {
		added: lines.filter((line) => line.kind === "added").length,
		removed: lines.filter((line) => line.kind === "removed").length,
	};
}

const PHRASES: Partial<Record<UpdateAction, (count: number) => string>> = {
	updated: (count) => `${count} updated`,
	added: (count) => `${count} added`,
	merged: (count) => `${count} merged with your edits`,
	conflict: (count) => `${count} conflict${count === 1 ? "" : "s"} to resolve`,
	deleted: (count) => `${count} deleted`,
};

/** One line for a choice: `1 updated, 1 added, 1 merged with your edits · +5 −2`. */
export function describeChange(change: ComponentChange): string {
	const counts = (["updated", "added", "merged", "conflict", "deleted"] as const)
		.map((action) => [action, change.files.filter((file) => file.action === action).length] as const)
		.filter(([, count]) => count > 0)
		.map(([action, count]) => PHRASES[action]?.(count) ?? "");

	const added = change.files.reduce((sum, file) => sum + file.added, 0);
	const removed = change.files.reduce((sum, file) => sum + file.removed, 0);

	return [
		...(change.isNew ? ["new"] : []),
		counts.join(", "),
		...(change.isNew && change.neededBy.length > 0 ? [`needed by ${change.neededBy.join(", ")}`] : []),
		`+${added} −${removed}`,
	].join(" · ");
}

/** The plan with every component not in `selected` left alone: nothing written, nothing recorded. */
export function onlySelected(decided: readonly Decided[], selected: ReadonlySet<string>): Decided[] {
	return decided.map((entry) =>
		selected.has(entry.file.item) || !CHANGES.has(entry.decision.action)
			? entry
			: { file: entry.file, decision: { action: "skipped", note: "not selected" } }
	);
}
