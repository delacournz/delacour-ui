import * as clack from "@clack/prompts";
import { diffLines, hasChanges, toHunks } from "../ui/diff";
import { createOutput, style } from "../ui/output";
import type { UpdateFile } from "../update/plan";
import { type PlanOptions, readPlan, type UpdateClients } from "./update";

/**
 * Shows what `update` would do to each file, and does none of it.
 *
 * Read-only, and it prints the plan `update` applies rather than a comparison
 * of its own. For a file the lock knows that means the registry's change on its
 * own — your edits are not in the diff, because they are not what moved. For a
 * file copied in before the lock existed there is nothing to tell the two
 * apart, so both sides are printed and no winner is picked.
 */

export type DiffOptions = PlanOptions & {
	silent?: boolean;
};

/** What was found, for a caller that printed none of it. */
export type DiffResult = {
	/** Files an update would change, or that differ with nothing to merge from. */
	differing: string[];
	/** Files carrying the project's own edits, with nothing new upstream. */
	edited: string[];
};

export async function diff(
	name: string | undefined,
	options: DiffOptions,
	clients?: UpdateClients
): Promise<DiffResult> {
	const output = createOutput(options);
	const { plan } = await readPlan(name ? [name] : [], options, output, clients);

	if (plan.files.length === 0) {
		output.info("No components from the registry are in this project yet.");
		return { differing: [], edited: [] };
	}

	const shown = plan.files.flatMap((file) => {
		const entry = describe(file);
		return entry ? [{ file, ...entry }] : [];
	});

	const edited = plan.files.filter((file) => file.result.state === "local").map((file) => file.displayPath);
	const result = { differing: shown.map(({ file }) => file.displayPath), edited };

	if (shown.length === 0) {
		// Not "everything matches" when it does not: an edited file is still
		// edited, there is just nothing in the registry to bring into it.
		output.success(
			edited.length === 0
				? "Everything matches the registry."
				: `Nothing new in the registry. ${edited.length} file${edited.length === 1 ? " carries" : "s carry"} your own edits.`
		);
		return result;
	}

	if (!output.silent) print(shown);
	output.info(footer(shown, name));

	return result;
}

type Shown = { file: UpdateFile; label: string; after: string | null };

function print(shown: readonly Shown[]): void {
	for (const { file, label, after } of shown) {
		const heading = `${style.bold(file.item)} ${style.path(file.displayPath)} ${style.dim(`— ${label}`)}`;
		clack.log.message([heading, ...hunks(file.local ?? "", after)].join("\n"));
	}
}

/** What to run next. Two commands, because a file with no lock entry cannot be merged by the first. */
function footer(shown: readonly Shown[], name: string | undefined): string {
	const unmerged = shown.filter(({ file }) => file.result.state === "untracked").length;
	const target = name ? ` ${name}` : "";
	const lines = [
		`${shown.length} file${shown.length === 1 ? " differs" : "s differ"}. ${style.code(`delacour update${target}`)} applies what can be merged.`,
	];

	if (unmerged > 0) {
		lines.push(
			`${unmerged} ${unmerged === 1 ? "has" : "have"} no lock entry to merge from: ${style.code(`delacour update${target} --base <ref>`)} names the ref ${unmerged === 1 ? "it" : "they"} came from, and ${style.code(`delacour add${target} --overwrite`)} takes the registry's copy.`
		);
	}

	return lines.join("\n");
}

/**
 * What to print for a file, or `null` for one with nothing to show.
 *
 * `after` is the text the file would hold once updated, or `null` for a line
 * that needs no diff under it.
 */
function describe(file: UpdateFile): { label: string; after: string | null } | null {
	const { result } = file;

	switch (result.state) {
		case "upstream":
			return { label: "changed in the registry", after: result.content };
		case "both":
			return {
				label:
					result.conflicts > 0
						? `changed in both, ${result.conflicts} conflict${result.conflicts === 1 ? "" : "s"}`
						: "changed in both, merges cleanly",
				after: result.content,
			};
		case "added":
			return { label: "new in the registry", after: null };
		case "removed-upstream":
			return result.onDisk ? { label: "no longer in the registry", after: null } : null;
		case "untracked":
			return result.adopt ? null : { label: "differs, with no lock entry to merge from", after: file.next };
		default:
			return null;
	}
}

function hunks(before: string, after: string | null): string[] {
	if (after === null) return [];

	const lines = diffLines(before, after);
	if (!hasChanges(lines)) return [];

	return toHunks(lines).flatMap((hunk) => [
		style.dim(`@@ -${hunk.before} +${hunk.after} @@`),
		...hunk.lines.map(render),
	]);
}

function render(line: { kind: "context" | "added" | "removed"; text: string }): string {
	if (line.kind === "added") return style.green(`+ ${line.text}`);
	if (line.kind === "removed") return style.red(`- ${line.text}`);
	return style.dim(`  ${line.text}`);
}
