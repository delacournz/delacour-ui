import type { SelectHighlightRange, SelectOption } from "../select/select.types";
import { buildSelectRows, normalizeSearchText } from "../select/select.variants";
import type {
	ComboboxEntry,
	ComboboxFilter,
	ComboboxInputChangeReason,
	ComboboxListRow,
	ComboboxOption,
	ComboboxOptionGroup,
	ComboboxOptionInput,
} from "./combobox.types";

/**
 * Pure filtering, highlighting and editing logic for `Combobox`.
 *
 * Free of React Native imports so all of it is unit-testable. Text folding is
 * Select's `normalizeSearchText` — defined once for every picker that filters a
 * list — so a combobox and a searchable select agree on what "matches" means.
 */

/** Whether an entry of the `options` prop is a group rather than an option. */
export function isComboboxOptionGroup(item: ComboboxOptionInput): item is ComboboxOptionGroup {
	return "options" in item;
}

/**
 * The `options` prop, or what `Combobox.Item` children declared, as one flat list.
 *
 * Select's `normalizeOptions` with the option type kept whole, so `keywords`
 * survive to the filter. A duplicate value is dropped and the first wins.
 */
export function normalizeComboboxOptions(items: readonly ComboboxOptionInput[]): ComboboxEntry[] {
	const seen = new Set<string>();
	const entries: ComboboxEntry[] = [];

	const push = (option: ComboboxOption, groupLabel?: string) => {
		if (seen.has(option.value)) return;
		seen.add(option.value);
		entries.push(groupLabel === undefined ? { option } : { groupLabel, option });
	};

	for (const item of items) {
		if (isComboboxOptionGroup(item)) {
			for (const option of item.options) push(option, item.label);
		} else {
			push(item);
		}
	}

	return entries;
}

/**
 * Whether one option answers the query under a filter.
 *
 * `default` folds case and accents and matches a substring of the label, then
 * of each keyword; a blank query matches everything. `custom` is handed the raw
 * option and the raw query and decides alone. `none` always answers — the
 * server already did the matching.
 */
export function matchOption(option: ComboboxOption, query: string, filter: ComboboxFilter): boolean {
	switch (filter.kind) {
		case "none":
			return true;
		case "custom":
			return filter.match(option, query);
		case "default": {
			const needle = normalizeSearchText(query);
			if (needle === "") return true;
			if (normalizeSearchText(option.label).includes(needle)) return true;
			return (option.keywords ?? []).some((keyword) => normalizeSearchText(keyword).includes(needle));
		}
	}
}

/**
 * The entries that answer the query, in their original order.
 *
 * Group membership travels with each entry, and headings are derived from what
 * remains (`buildComboboxRows`), so a group the query empties loses its heading
 * with no special case. A disabled option that matches stays, and so does a
 * selected one — the list is where a choice is undone.
 */
export function filterItems(entries: readonly ComboboxEntry[], query: string, filter: ComboboxFilter): ComboboxEntry[] {
	return entries.filter((entry) => matchOption(entry.option, query, filter));
}

/**
 * The sheet's rows: the "Use “query”" row when one is offered, then Select's
 * headings and options.
 *
 * The create row leads because it is the answer to exactly what was typed;
 * below a long list of partial matches nobody would reach it.
 */
export function buildComboboxRows(entries: readonly ComboboxEntry[], createQuery: string | null): ComboboxListRow[] {
	const rows: ComboboxListRow[] = buildSelectRows(entries);
	return createQuery === null ? rows : [{ key: "create", kind: "create", query: createQuery }, ...rows];
}

/**
 * The label folded character by character, with each folded unit's span in
 * the original string.
 *
 * Folding can shrink a character to nothing (a combining mark) or leave it
 * whole; walking by code point keeps a surrogate pair together. The map is what
 * lets a match found in the folded text be drawn on the original.
 */
function foldWithMap(label: string): { folded: string; spans: { start: number; end: number }[] } {
	let folded = "";
	const spans: { start: number; end: number }[] = [];
	let index = 0;
	for (const char of label) {
		const piece = char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
		for (const unit of piece) {
			folded += unit;
			for (let k = 0; k < unit.length; k += 1) spans.push({ end: index + char.length, start: index });
		}
		index += char.length;
	}
	return { folded, spans };
}

/** Advances past combining marks that follow `end`, so a highlight keeps a letter's accent. */
function extendOverMarks(label: string, end: number): number {
	let cursor = end;
	while (cursor < label.length) {
		const char = String.fromCodePoint(label.codePointAt(cursor) ?? 0);
		if (char.normalize("NFD").replace(/\p{M}/gu, "") !== "") break;
		cursor += char.length;
	}
	return cursor;
}

/**
 * Where a query appears in a label, as ranges over the ORIGINAL string.
 *
 * Case- and accent-insensitive, the way the default filter matches, so "ecl"
 * lights up "Écl" in "Éclair" — the whole accented letter, never half of it.
 * The first occurrence by default; `all` for every non-overlapping one. A blank
 * query, or one that is not in the label, has no ranges.
 */
export function getHighlightRanges(
	label: string,
	query: string,
	{ all = false }: { all?: boolean } = {}
): SelectHighlightRange[] {
	const needle = normalizeSearchText(query);
	if (needle === "") return [];
	const { folded, spans } = foldWithMap(label);
	if (needle.length > folded.length) return [];

	const ranges: SelectHighlightRange[] = [];
	let from = 0;
	while (from <= folded.length - needle.length) {
		const at = folded.indexOf(needle, from);
		if (at === -1) break;
		const first = spans[at];
		const last = spans[at + needle.length - 1];
		if (first && last) ranges.push({ end: extendOverMarks(label, last.end), start: first.start });
		if (!all) break;
		from = at + needle.length;
	}
	return ranges;
}

/**
 * Whether to offer the typed text as a value of its own.
 *
 * Only with `allowCustomValue`, only for a query with something in it, and
 * never when an option's label already says exactly that (after folding) or the
 * text is already chosen — two rows that would do the same thing are one too
 * many.
 */
export function shouldOfferCreate({
	query,
	entries,
	selected,
	allowCustomValue,
}: {
	query: string;
	entries: readonly ComboboxEntry[];
	selected: readonly string[];
	allowCustomValue: boolean;
}): boolean {
	if (!allowCustomValue) return false;
	const needle = normalizeSearchText(query);
	if (needle === "") return false;
	if (entries.some((entry) => normalizeSearchText(entry.option.label) === needle)) return false;
	return !selected.some((value) => normalizeSearchText(value) === needle);
}

/** Whether the last chip is marked for removal. */
export type ComboboxPendingRemoveState = { kind: "idle" } | { kind: "pending"; index: number };

/** What happened in the search field, as the chip row cares about it. */
export type ComboboxPendingRemoveEvent =
	| { type: "backspace"; query: string; chipCount: number }
	| { type: "keystroke" }
	| { type: "blur" };

export type ComboboxPendingRemoveResult = { state: ComboboxPendingRemoveState; removeIndex: number | null };

const IDLE: ComboboxPendingRemoveState = { kind: "idle" };

/**
 * Backspace on an empty query, in two steps: the first marks the last chip, the
 * second removes it.
 *
 * One press deleting a chip outright would take a choice away from someone who
 * only meant to delete a letter and held the key one beat too long. Any other
 * key, or leaving the field, clears the mark. A mark left past the end — the
 * chips changed underneath it — is re-aimed at the last chip rather than
 * removing the wrong one.
 */
export function resolvePendingRemove(
	state: ComboboxPendingRemoveState,
	event: ComboboxPendingRemoveEvent
): ComboboxPendingRemoveResult {
	if (event.type !== "backspace") return { removeIndex: null, state: IDLE };
	if (event.query !== "" || event.chipCount === 0) return { removeIndex: null, state: IDLE };

	const last = event.chipCount - 1;
	if (state.kind === "pending" && state.index === last) return { removeIndex: last, state: IDLE };
	return { removeIndex: null, state: { index: last, kind: "pending" } };
}

/**
 * The query change a pick, a clear or a close reports, or `null` when the query
 * is already empty and there is nothing to say.
 *
 * The query belongs to the sheet: the trigger shows the selection, so every way
 * of finishing with the list — a pick, the clear button, a close — empties it,
 * and the next open starts from the whole list.
 */
export function resolveQueryReset(
	query: string,
	reason: Exclude<ComboboxInputChangeReason, "type">
): { value: ""; reason: Exclude<ComboboxInputChangeReason, "type"> } | null {
	return query === "" ? null : { reason, value: "" };
}

/** "1 result" / "N results". English by default; pass `format` to localise. */
export function formatResultsCount(count: number): string {
	return count === 1 ? "1 result" : `${count} results`;
}

/**
 * What a screen reader is told after the list filters, or `null` before
 * anything is typed — announcing the size of the whole list on open is noise.
 */
export function resolveResultsAnnouncement({
	count,
	query,
	emptyText,
	format = formatResultsCount,
}: {
	count: number;
	query: string;
	emptyText: string;
	format?: (count: number) => string;
}): string | null {
	if (normalizeSearchText(query) === "") return null;
	return count === 0 ? emptyText : format(count);
}

/**
 * The options behind the selected values, in the order they were chosen.
 *
 * A server-driven list changes under the selection, so a value whose option has
 * scrolled out of `entries` is looked up in `remembered` — the options as they
 * were when picked. Failing that, a custom value is its own label when custom
 * values are allowed; otherwise it is skipped rather than shown as a raw id.
 */
export function resolveSelectedComboboxOptions({
	entries,
	selected,
	remembered,
	allowCustomValue,
}: {
	entries: readonly ComboboxEntry[];
	selected: readonly string[];
	remembered: ReadonlyMap<string, SelectOption>;
	allowCustomValue: boolean;
}): SelectOption[] {
	const byValue = new Map<string, SelectOption>(entries.map((entry) => [entry.option.value, entry.option]));
	return selected.flatMap((value) => {
		const option = byValue.get(value) ?? remembered.get(value);
		if (option) return [option];
		return allowCustomValue ? [{ label: value, value }] : [];
	});
}
