import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/**
 * How an item shows it is picked.
 *
 * `leading` slides a round indicator in from the leading edge and pushes the
 * content over — a row in a list. `ring` draws a primary ring a gap outside the
 * item, with a small check badge — a swatch, an avatar, a tile. `none` draws
 * nothing, and the caller reads `isSelected` to paint its own.
 */
export const SELECTION_INDICATORS = ["leading", "ring", "none"] as const;

/** `edge` is a full-width bar on the page's own surface; `floating` is an inset card above it. */
export const SELECTION_BAR_PLACEMENTS = ["edge", "floating"] as const;

export type SelectionIndicator = (typeof SELECTION_INDICATORS)[number];
export type SelectionBarPlacement = (typeof SELECTION_BAR_PLACEMENTS)[number];

/**
 * How far a `leading` indicator pushes the content: the 22pt circle plus a 12pt
 * gap. A number because the slide animates a width, which a class cannot.
 */
export const SELECTION_MODE_INDICATOR_OFFSET = 34;

/** Theme token an action's label and icon both read, so the two cannot drift. */
export const SELECTION_MODE_ACTION_FOREGROUND_TOKEN = {
	default: "foreground",
	destructive: "destructive",
} as const;

/** Theme token the check inside a picked indicator is drawn in. */
export const SELECTION_MODE_CHECK_TOKEN = "primary-foreground";

/** The timings every transition here shares. Reduced motion collapses each to a 150ms fade. */
export const SELECTION_MODE_MOTION = {
	reducedFadeMs: 150,
	fadeMs: 200,
	headerTravel: 8,
	spring: { damping: 18, mass: 0.6, stiffness: 260 },
} as const;

/**
 * Styling for every part of a selection.
 *
 * `text-*` lives on the label slots only — a React Native `View` does not
 * cascade colour to its text (package rule 1).
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const selectionModeVariants = tv({
	slots: {
		root: "flex-1",
		item: "relative",
		indicatorSlot: "absolute inset-y-0 start-4 justify-center",
		indicator: "size-5.5 items-center justify-center rounded-full border-2",
		indicatorCheck: "size-icon-xs",
		ring: "absolute -inset-1 rounded-xl border-2 border-primary",
		ringBadge:
			"absolute -end-1.5 -top-1.5 size-icon-md items-center justify-center rounded-full border-2 border-background bg-primary",
		header: "h-navbar-row flex-row items-center gap-2 border-b border-border bg-background px-2",
		headerTitle: "flex-1 font-semibold text-base text-foreground",
		bar: "absolute inset-x-0 bottom-0 flex-row items-stretch px-2 pt-2",
		action: "min-h-14 flex-1 items-center justify-center gap-1 rounded-lg px-1 py-1.5",
		actionLabel: "font-medium text-xs",
		group: "",
		groupLabel: "px-1 pb-2 font-medium text-muted-foreground text-sm",
	},
	variants: {
		indicator: {
			leading: { item: "flex-row items-center" },
			ring: {},
			none: {},
		},
		placement: {
			edge: { bar: "border-t border-border bg-background" },
			floating: { bar: "mx-4 mb-2 rounded-2xl bg-elevated pb-2 shadow-lg" },
		},
		isSelected: {
			true: { indicator: "border-primary bg-primary" },
			false: { indicator: "border-border" },
		},
		isDestructive: {
			true: { actionLabel: "text-destructive" },
			false: { actionLabel: "text-foreground" },
		},
		isDisabled: {
			true: { action: "opacity-50" },
			false: {},
		},
		layout: {
			stack: { group: "overflow-hidden rounded-lg border border-border bg-card" },
			grid: { group: "flex-row flex-wrap" },
			strip: { group: "" },
		},
	},
	compoundVariants: [{ indicator: "leading", isSelected: true, class: { item: "bg-primary/5" } }],
	defaultVariants: {
		indicator: "leading",
		placement: "edge",
		isSelected: false,
		isDestructive: false,
		isDisabled: false,
		layout: "stack",
	},
});

export type SelectionModeVariantProps = VariantProps<typeof selectionModeVariants>;

/**
 * The selection after `value` is pressed.
 *
 * Adds an unpicked value at the end, so the list keeps the order things were
 * picked in, and removes a picked one. A disabled value never moves. At `max`
 * an unpicked value does not go on, but a picked one still comes off — the way
 * out of a full selection is always open.
 *
 * Always a fresh array; {@link resolveIsSameSelection} is how a caller tells a
 * no-op apart, so `onSelectedChange` is never called with what it already holds.
 */
export function resolveToggle({
	selected,
	value,
	max,
	isDisabled = false,
}: {
	selected: readonly string[];
	value: string;
	max?: number;
	isDisabled?: boolean;
}): string[] {
	if (isDisabled) return [...selected];
	if (selected.includes(value)) return selected.filter((entry) => entry !== value);
	if (max !== undefined && selected.length >= max) return [...selected];
	return [...selected, value];
}

/**
 * Every value picked, up to `max`.
 *
 * Existing picks keep their place at the front, then `values` fill in list
 * order until the cap. A pick already past the cap — a controlled selection
 * handed more than `max` — is never dropped; select-all only adds.
 */
export function resolveSelectAll({
	selected,
	values,
	max,
}: {
	selected: readonly string[];
	values: readonly string[];
	max?: number;
}): string[] {
	const next = [...selected];
	const cap = max ?? Number.POSITIVE_INFINITY;
	for (const value of values) {
		if (next.length >= cap) break;
		if (!next.includes(value)) next.push(value);
	}
	return next;
}

/**
 * Whether select-all has nothing left to do — the moment the control becomes
 * "Deselect all".
 *
 * True once every value is picked, or once the cap is reached when the cap is
 * below the total: past that point select-all would add nothing.
 */
export function resolveIsAllSelected({
	selected,
	values,
	max,
}: {
	selected: readonly string[];
	values: readonly string[];
	max?: number;
}): boolean {
	if (values.length === 0) return false;
	if (max !== undefined && max < values.length && selected.length >= max) return true;
	return values.every((value) => selected.includes(value));
}

/** Whether two selections hold the same ids in the same order. */
export function resolveIsSameSelection(a: readonly string[], b: readonly string[]): boolean {
	return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** What one press on an item does — see {@link resolveItemPress}. */
export type SelectionItemPress = { kind: "toggle" } | { kind: "press" } | { kind: "none" };

/**
 * What a press on an item does.
 *
 * Inactive, the row's own `onPress` runs. Active, the press toggles the item and
 * the row's own handler does not run. A disabled item never toggles, but its own
 * press still runs even while active — a section header, a "load more" row.
 * `none` is a press with no handler to run.
 */
export function resolveItemPress({
	isActive,
	isDisabled,
	hasOnPress = true,
}: {
	isActive: boolean;
	isDisabled: boolean;
	hasOnPress?: boolean;
}): SelectionItemPress {
	if (isActive && !isDisabled) return { kind: "toggle" };
	return hasOnPress ? { kind: "press" } : { kind: "none" };
}

/**
 * The header's label: `"{title} · n of m"` when the total is known, or
 * `"n selected"` when it is not. The title is dropped without a total — on its
 * own it would say nothing the count does not.
 */
export function resolveHeaderCount({ count, total, title }: { count: number; total?: number; title?: string }): string {
	if (total === undefined) return `${count} selected`;
	const tally = `${count} of ${total}`;
	return title ? `${title} · ${tally}` : tally;
}

/** How a group lays its items out — see {@link resolveGroupLayout}. */
export type SelectionGroupLayout = { kind: "stack" } | { kind: "grid"; columns: number } | { kind: "strip" };

/**
 * How a group lays its items out.
 *
 * `isHorizontal` is a single scrolling row and wins over `columns`. Two or more
 * columns is a grid; one column, or none, is a stacked card list.
 */
export function resolveGroupLayout({
	columns,
	isHorizontal = false,
}: {
	columns?: number;
	isHorizontal?: boolean;
}): SelectionGroupLayout {
	if (isHorizontal) return { kind: "strip" };
	const whole = columns === undefined ? 1 : Math.floor(columns);
	if (whole >= 2) return { columns: whole, kind: "grid" };
	return { kind: "stack" };
}

/** One grid cell's width: the measured row less its gaps, split evenly. Zero before measurement. */
export function resolveGridItemWidth({
	containerWidth,
	columns,
	gap,
}: {
	containerWidth: number;
	columns: number;
	gap: number;
}): number {
	if (containerWidth <= 0 || columns <= 0) return 0;
	return Math.max(0, (containerWidth - gap * (columns - 1)) / columns);
}

/** Whether an item's indicator is drawn: only while the mode is on, unless always shown. `none` never draws. */
export function resolveIndicatorShown({
	indicator,
	isActive,
	isIndicatorAlwaysShown = false,
}: {
	indicator: SelectionIndicator;
	isActive: boolean;
	isIndicatorAlwaysShown?: boolean;
}): boolean {
	if (indicator === "none") return false;
	return isActive || isIndicatorAlwaysShown;
}

/** Whether the action bar is up: only in the mode, and only with something picked unless `isShownWhenEmpty`. */
export function resolveBarVisible({
	count,
	isActive,
	isShownWhenEmpty = false,
}: {
	count: number;
	isActive: boolean;
	isShownWhenEmpty?: boolean;
}): boolean {
	return isActive && (count > 0 || isShownWhenEmpty);
}

/** The long-press action an inactive item offers a screen reader. */
export const SELECTION_MODE_START_ACTION = { label: "Start selecting", name: "longpress" } as const;

/** What a screen reader is told an item is — see {@link resolveItemAccessibility}. */
export type SelectionItemAccessibility =
	| {
			kind: "checkbox";
			accessibilityRole: "checkbox";
			accessibilityState: { checked: boolean; disabled: boolean };
			accessibilityHint: string;
	  }
	| {
			kind: "inherit";
			accessibilityActions: { name: string; label: string }[];
	  };

/**
 * What a screen reader is told an item is.
 *
 * Active, it is a checkbox, checked or not — the press toggles it. Inactive it
 * keeps the semantics of whatever it wraps, and offers the long press as a named
 * action so the mode can be entered without the gesture. A disabled item cannot
 * start the mode, so it offers nothing.
 */
export function resolveItemAccessibility({
	isActive,
	isDisabled,
	isSelected,
}: {
	isActive: boolean;
	isDisabled: boolean;
	isSelected: boolean;
}): SelectionItemAccessibility {
	if (isActive) {
		return {
			accessibilityHint: "Double-tap to select",
			accessibilityRole: "checkbox",
			accessibilityState: { checked: isSelected, disabled: isDisabled },
			kind: "checkbox",
		};
	}
	return { accessibilityActions: isDisabled ? [] : [{ ...SELECTION_MODE_START_ACTION }], kind: "inherit" };
}
