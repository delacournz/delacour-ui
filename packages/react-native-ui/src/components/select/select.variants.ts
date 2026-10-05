import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import { type InputBoxState, resolveInputGroupClass } from "../input/input.variants";
import type {
	SelectEntry,
	SelectHighlightRange,
	SelectListRow,
	SelectOption,
	SelectOptionGroup,
	SelectOptionInput,
	SelectRowOption,
	SelectSelectionMode,
} from "./select.types";

export const SELECT_SELECTION_MODES = ["single", "multiple"] as const;

export const SELECT_PRESENTATIONS = ["sheet"] as const;

/** How many labels a multiple trigger joins before it switches to a count. */
export const SELECT_DEFAULT_MAX_LABELS = 2;

/** Theme token the chevron and the loading spinner take, and the one they take when invalid. */
export const SELECT_ICON_TOKEN = "muted-foreground";
export const SELECT_INVALID_ICON_TOKEN = "destructive";

/** Theme token the single-mode check takes. */
export const SELECT_CHECK_TOKEN = "primary";

/** Theme token the tick inside a selected multiple-mode box takes — content on a `primary` fill. */
export const SELECT_CHECKBOX_TICK_TOKEN = "primary-foreground";

/** How long the selection indicator takes to fade and scale in. */
export const SELECT_INDICATOR_DURATION_MS = 120;

/** The scale the indicator grows from. Calm motion skips the scale and keeps the fade. */
export const SELECT_INDICATOR_FROM_SCALE = 0.6;

/** How long the chevron's half-turn takes under calm motion, where the spring becomes a timing. */
export const SELECT_CHEVRON_CALM_DURATION_MS = 160;

/** The most of the window a sheet sized to its rows may take — a long list scrolls inside it. */
export const SELECT_SHEET_MAX_FRACTION = 0.85;

/** Points kept clear below the top safe-area inset, so the sheet never meets the status bar. */
export const SELECT_SHEET_TOP_GAP = 24;

/**
 * The ceiling for a sheet that sizes itself to its rows.
 *
 * Without one, two hundred options measure taller than the screen and the sheet
 * rises under the status bar with nothing of the page left above it. The lower
 * of a fraction of the window and the room below the top inset wins, and an
 * open keyboard comes off the second: the sheet rides above it, and a full list
 * plus the keyboard would otherwise reach the top of the screen.
 */
export function resolveSelectSheetMaxHeight({
	windowHeight,
	topInset,
	keyboardHeight = 0,
}: {
	windowHeight: number;
	topInset: number;
	/** The sheet is lifted above an open keyboard, so the room it may take shrinks by the keyboard's height. */
	keyboardHeight?: number;
}): number {
	const byFraction = windowHeight * SELECT_SHEET_MAX_FRACTION;
	const belowInset = windowHeight - topInset - SELECT_SHEET_TOP_GAP - keyboardHeight;
	return Math.max(0, Math.floor(Math.min(byFraction, belowInset)));
}

/**
 * Styling for every part of a select.
 *
 * **The trigger draws no box of its own.** Its chrome is `Input`'s `root` slot,
 * reached through `resolveInputGroupClass` — the same row a decorated field
 * wears — so a select sitting under a text field in a form is the same box
 * rather than a lookalike. The `trigger` slot adds only what a trigger has and
 * a field does not. `select.variants.test.ts` sweeps every variant, size and
 * state and asserts every utility of the field's box is present on the trigger.
 *
 * **A row's floor is ListGroup's.** `min-h-12/14/16` at `sm/md/lg`, so a row in
 * the sheet sits level with a `ListGroup` row on the screen behind it; the test
 * pins the pair. It is a floor and never a height, so a description can wrap.
 *
 * The row slot holds no `text-*` utility — a React Native `View` does not
 * cascade colour to a `Text` descendant — so the label's colour and scale live
 * on `rowLabel`, which is always the `Text` itself. See AGENTS.md rule 1.
 *
 * `rowCheckbox` draws multiple mode's box with Checkbox's own tokens —
 * `border-input bg-card`, filling `bg-primary` — rather than importing
 * `../checkbox`, whose animated, measured box is a control in its own right and
 * would answer presses the row already answers.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const selectVariants = tv({
	slots: {
		/*
		 * Added to Input's box. The box is no longer a row itself — `Input.Group`
		 * lays its decorators out in an inner row — so the trigger, which has no
		 * inner row, lays out the value and the chevron here.
		 */
		trigger: "flex-row items-center",
		value: "flex-1 font-sans text-foreground",
		placeholder: "flex-1 font-sans text-muted-foreground",
		/** Edge length of the chevron and the spinner that replaces it. */
		chevron: "items-center justify-center",
		row: "w-full flex-row items-center rounded-md",
		/** Edge length of a leading glyph from `Select.Item`'s `icon`. */
		rowIcon: "",
		rowContent: "flex-1 justify-center gap-0.5",
		rowLabel: "font-medium text-popover-foreground",
		rowDescription: "text-muted-foreground",
		rowIndicator: "items-center justify-center",
		rowCheckbox: "items-center justify-center overflow-hidden border border-input bg-card",
		/** Layout only — the heading is a `Text.Overline`, which owns its type. */
		groupHeading: "pb-1.5 pt-4",
		/** The sheet's title and search field, above the rows. */
		header: "gap-3 pb-3",
		empty: "items-center justify-center py-8",
		/** Overrides the sheet's list gutter gap: rows touch, the way a list's do. */
		sheetBody: "gap-0",
	},
	variants: {
		variant: {
			primary: {},
			secondary: {},
		},
		size: {
			sm: {
				trigger: "gap-1.5",
				value: "text-input-sm leading-tight",
				placeholder: "text-input-sm leading-tight",
				chevron: "size-icon-sm",
				row: "min-h-12 gap-2.5 px-3 py-2",
				rowIcon: "size-icon-md",
				rowLabel: "text-sm",
				rowDescription: "text-xs",
				rowIndicator: "size-icon-md",
				rowCheckbox: "size-icon-md rounded-xs",
				groupHeading: "px-3",
			},
			md: {
				trigger: "gap-2",
				value: "text-input-md leading-tight",
				placeholder: "text-input-md leading-tight",
				chevron: "size-icon-md",
				row: "min-h-14 gap-3 px-4 py-3",
				rowIcon: "size-icon-lg",
				rowLabel: "text-base",
				rowDescription: "text-sm",
				rowIndicator: "size-icon-lg",
				rowCheckbox: "size-icon-lg rounded-xs",
				groupHeading: "px-4",
			},
			lg: {
				trigger: "gap-2.5",
				value: "text-input-lg leading-tight",
				placeholder: "text-input-lg leading-tight",
				chevron: "size-icon-lg",
				row: "min-h-16 gap-3.5 px-5 py-4",
				rowIcon: "size-icon-xl",
				rowLabel: "text-lg",
				rowDescription: "text-base",
				rowIndicator: "size-icon-xl",
				rowCheckbox: "size-icon-xl rounded-sm",
				groupHeading: "px-5",
			},
		},
		// The empty `false` branches are load-bearing typing, not placeholders —
		// see the note in button.variants.ts.
		isSelected: {
			true: { row: "bg-accent", rowLabel: "text-accent-foreground", rowCheckbox: "border-primary bg-primary" },
			false: {},
		},
		isDisabled: { true: { row: "opacity-50" }, false: {} },
		isInvalid: { true: {}, false: {} },
		isFocused: { true: {}, false: {} },
	},
	defaultVariants: {
		variant: "primary",
		size: "md",
		isSelected: false,
		isDisabled: false,
		isInvalid: false,
		isFocused: false,
	},
});

export type SelectVariantProps = VariantProps<typeof selectVariants>;

/**
 * The class the trigger wears: Input's box, laid out as a row.
 *
 * `isFocused` is the sheet being open — the ring says which field the sheet
 * belongs to. Invalid outranks it, exactly as it does on a field.
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveSelectTriggerClass({
	className,
	...state
}: Pick<InputBoxState, "variant" | "size" | "isDisabled" | "isFocused" | "isInvalid"> & {
	className?: string;
}): string {
	const own = selectVariants({ size: state.size, variant: state.variant }).trigger({ className });
	return resolveInputGroupClass({ ...state, className: own });
}

/** The token the chevron and the trigger's spinner take. */
export function resolveSelectIconToken(isInvalid: boolean): string {
	return isInvalid ? SELECT_INVALID_ICON_TOKEN : SELECT_ICON_TOKEN;
}

/** Whether an entry of the `options` prop is a group rather than an option. */
export function isSelectOptionGroup(item: SelectOptionInput): item is SelectOptionGroup {
	return "options" in item;
}

/**
 * A controlled `value` as the list of selected values the component holds inside.
 *
 * `undefined` stays `undefined` — that is "uncontrolled", not "nothing chosen".
 * A single `null` is nothing chosen; a string is one. An array is copied, so a
 * caller mutating theirs cannot reach into the component's state.
 */
export function toSelectedValues(value: string | null | readonly string[] | undefined): readonly string[] | undefined {
	if (value === undefined) return undefined;
	if (value === null) return [];
	if (typeof value === "string") return [value];
	return [...value];
}

/**
 * What a press on a row did.
 *
 * `limit-reached` is a `selected` that filled the last slot, and `blocked` is a
 * press refused at the limit — both are worth a warning haptic. `unchanged` is a
 * single-mode press on the row already chosen.
 */
export type SelectToggleChange = "selected" | "deselected" | "unchanged" | "blocked" | "limit-reached";

export type SelectToggleResult = { selected: readonly string[]; change: SelectToggleChange };

export type SelectToggleOptions = { mode: "single"; isClearable?: boolean } | { mode: "multiple"; max?: number };

/**
 * The selection after a press on `value`.
 *
 * Single replaces, and a second press on the chosen row keeps it unless the
 * select is clearable. Multiple appends in the order chosen, removes on a
 * second press, refuses an add at `max` and never duplicates — not even when
 * handed a list that already did.
 */
export function toggleSelection(
	current: readonly string[],
	value: string,
	options: SelectToggleOptions
): SelectToggleResult {
	const unique = [...new Set(current)];
	const isSelected = unique.includes(value);

	if (options.mode === "single") {
		if (!isSelected) return { change: "selected", selected: [value] };
		return options.isClearable ? { change: "deselected", selected: [] } : { change: "unchanged", selected: unique };
	}

	if (isSelected) return { change: "deselected", selected: unique.filter((item) => item !== value) };
	if (options.max !== undefined && unique.length >= options.max) return { change: "blocked", selected: unique };

	const selected = [...unique, value];
	const change = options.max !== undefined && selected.length >= options.max ? "limit-reached" : "selected";
	return { change, selected };
}

/**
 * The `options` prop, or what `Select.Item` children declared, as one flat list.
 *
 * Each option keeps the heading of the group it came from. A duplicate value is
 * dropped and the first one wins — two rows answering to one value would select
 * together and could never be told apart. An empty group contributes nothing,
 * so it never draws a heading over no rows.
 */
export function normalizeOptions(items: readonly (SelectOptionInput | SelectRowOptionGroup)[]): SelectEntry[] {
	const seen = new Set<string>();
	const entries: SelectEntry[] = [];

	const push = (option: SelectRowOption, groupLabel?: string) => {
		if (seen.has(option.value)) return;
		seen.add(option.value);
		entries.push(groupLabel === undefined ? { option } : { groupLabel, option });
	};

	for (const item of items) {
		if (isSelectOptionGroup(item)) {
			for (const option of item.options) push(option, item.label);
		} else {
			push(item);
		}
	}

	return entries;
}

/** A group whose options carry what `Select.Item` can say — what the declarative form collects. */
export type SelectRowOptionGroup = { label: string; options: readonly SelectRowOption[] };

/**
 * The sheet's rows: each option, with a heading before the first option of each
 * run sharing a group.
 *
 * Flat, so a virtualised list can draw it; a heading is a row like any other.
 * Keys are prefixed by kind, so a heading and an option with the same text
 * never collide.
 */
export function buildSelectRows(entries: readonly SelectEntry[]): SelectListRow[] {
	const rows: SelectListRow[] = [];
	let previous: string | undefined;
	let headingIndex = 0;

	for (const { option, groupLabel } of entries) {
		if (groupLabel !== undefined && groupLabel !== previous) {
			rows.push({ key: `heading:${headingIndex}:${groupLabel}`, kind: "heading", label: groupLabel });
			headingIndex += 1;
		}
		previous = groupLabel;
		rows.push(
			groupLabel === undefined
				? { key: `option:${option.value}`, kind: "option", option }
				: { groupLabel, key: `option:${option.value}`, kind: "option", option }
		);
	}

	return rows;
}

/**
 * Text folded for matching: trimmed, lower-cased, with combining marks removed.
 *
 * `NFD` splits an accented letter into its base and its mark, and the mark is
 * then dropped — so "Österreich" is found by "oster", and "éCl" finds "Eclair".
 */
export function normalizeSearchText(text: string): string {
	return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/**
 * Whether a label answers a query. Case- and accent-insensitive; an empty or
 * blank query matches everything.
 *
 * Defined once, here, for every picker in the library that filters a list.
 */
export function matchesQuery(label: string, query: string): boolean {
	const needle = normalizeSearchText(query);
	if (needle === "") return true;
	return normalizeSearchText(label).includes(needle);
}

/**
 * The entries whose label answers the query.
 *
 * A group with nothing left disappears with its heading, because headings are
 * derived from the entries that remain. A disabled option that matches stays:
 * it is information — "that one exists, and you cannot have it".
 */
export function filterGroups(entries: readonly SelectEntry[], query: string): SelectEntry[] {
	if (normalizeSearchText(query) === "") return [...entries];
	return entries.filter((entry) => matchesQuery(entry.option.label, query));
}

/** The trigger's count text past the label limit. English by default; pass your own to localise. */
export function formatSelectedCount(count: number): string {
	return `${count} selected`;
}

/**
 * What the trigger reads: the chosen label, a short list of them, or a count.
 *
 * `undefined` means the placeholder shows. A value with no option behind it is
 * skipped rather than shown raw — a stale id in a form is not something a reader
 * should be handed.
 */
export function resolveSelectTriggerText({
	entries,
	selected,
	mode,
	maxLabels = SELECT_DEFAULT_MAX_LABELS,
	formatSelectedCount: format = formatSelectedCount,
}: {
	entries: readonly SelectEntry[];
	selected: readonly string[];
	mode: SelectSelectionMode;
	maxLabels?: number;
	formatSelectedCount?: (count: number) => string;
}): string | undefined {
	const labels = resolveSelectedOptions(entries, selected).map((option) => option.label);
	if (labels.length === 0) return undefined;
	if (mode === "single") return labels[0];
	return labels.length > maxLabels ? format(labels.length) : labels.join(", ");
}

/** The options behind the selected values, in the order they were chosen. Unknown values are skipped. */
export function resolveSelectedOptions(entries: readonly SelectEntry[], selected: readonly string[]): SelectOption[] {
	const byValue = new Map(entries.map((entry) => [entry.option.value, entry.option]));
	return selected.flatMap((value) => {
		const option = byValue.get(value);
		return option ? [option] : [];
	});
}

/** Whether a row answers presses, and why not when it does not. */
export type SelectRowState = { isDisabled: false } | { isDisabled: true; reason: "option" | "limit" };

/**
 * Whether one row can be pressed.
 *
 * Its own `isDisabled` comes first. Then the limit: once `maxSelected` rows are
 * chosen every unchosen row is disabled — but a chosen one never is, or the
 * selection could never be undone.
 */
export function resolveSelectRowState({
	option,
	isSelected,
	selectedCount,
	maxSelected,
}: {
	option: SelectOption;
	isSelected: boolean;
	selectedCount: number;
	maxSelected?: number;
}): SelectRowState {
	if (option.isDisabled) return { isDisabled: true, reason: "option" };
	if (!isSelected && maxSelected !== undefined && selectedCount >= maxSelected) {
		return { isDisabled: true, reason: "limit" };
	}
	return { isDisabled: false };
}

/** A run of a label, emphasised or not. */
export type SelectLabelSegment = { text: string; isHighlighted: boolean };

/**
 * A label cut into plain and emphasised runs, for a row that shows what a
 * query matched.
 *
 * Ranges are sorted, clamped to the label, and an empty or overlapping one is
 * dropped rather than trusted — a range computed against a differently folded
 * string must not throw or draw a letter twice.
 */
export function splitHighlight(
	label: string,
	ranges: readonly SelectHighlightRange[] | undefined
): SelectLabelSegment[] {
	const sorted = [...(ranges ?? [])]
		.map(({ start, end }) => ({ end: Math.min(Math.max(end, 0), label.length), start: Math.max(start, 0) }))
		.filter(({ start, end }) => end > start)
		.sort((a, b) => a.start - b.start);

	const segments: SelectLabelSegment[] = [];
	let cursor = 0;
	for (const { start, end } of sorted) {
		if (start < cursor) continue;
		if (start > cursor) segments.push({ isHighlighted: false, text: label.slice(cursor, start) });
		segments.push({ isHighlighted: true, text: label.slice(start, end) });
		cursor = end;
	}
	if (cursor < label.length || segments.length === 0) {
		segments.push({ isHighlighted: false, text: label.slice(cursor) });
	}
	return segments;
}
