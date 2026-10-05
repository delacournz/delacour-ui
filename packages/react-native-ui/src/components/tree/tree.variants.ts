import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { IconSize } from "../icon/icon.variants";
import type { TextSize } from "../text/text.variants";

export const TREE_SIZES = ["sm", "md"] as const;
export const TREE_SELECTION_MODES = ["none", "single", "multiple"] as const;

export type TreeSize = (typeof TREE_SIZES)[number];
export type TreeSelectionMode = (typeof TREE_SELECTION_MODES)[number];

/** The size a tree falls back to when none is named. Pinned against `defaultVariants`. */
export const TREE_DEFAULT_SIZE: TreeSize = "md";

/** Points each nesting level moves a row in. */
export const TREE_DEFAULT_INDENT = 16;

/** The smallest edge a touch target may have, in points — the platform guideline. */
export const TREE_MIN_TOUCH = 44;

/** A row's height, in points. The `trigger` slot writes it out as `min-h-*`; a test pins the two. */
export const TREE_ROW_HEIGHT: Record<TreeSize, number> = { sm: 36, md: 44 };

/** The indicator column's width, in points. The `indicator` slot writes it out; a test pins the two. */
export const TREE_INDICATOR_WIDTH: Record<TreeSize, number> = { sm: 20, md: 24 };

/**
 * The padding either side of a row's content, in points. The end is the `trigger`
 * slot's `pe-2`; the start is an inline style, because it grows with depth and a
 * runtime number can never be a class.
 */
export const TREE_ROW_INSET = 8;

/** The `Text` step each tree size hands `Tree.Label`. */
export const TREE_LABEL_TEXT_SIZE: Record<TreeSize, TextSize> = { sm: "sm", md: "md" };

/** The icon step every glyph on a row is drawn at — the indicator and anything in `Tree.Icon`. */
export const TREE_GLYPH_STEP: Record<TreeSize, IconSize> = { sm: "xs", md: "sm" };

/**
 * The spring the indicator turns on.
 *
 * `Collapsible`'s, restated rather than imported so `delacour add tree` copies one
 * folder — the registry derives an item's dependencies from its imports. A test
 * pins the two equal, so a branch and a collapsible open with the same feel.
 */
export const TREE_SPRING = { damping: 26, mass: 0.4, stiffness: 400 } as const;

/** Where the indicator points at rest, in degrees — a quarter turn, from the label to the children. */
export const TREE_INDICATOR_ROTATION = { collapsed: 0, expanded: 90 } as const;

/** How long a group takes to fade in on open, in milliseconds. */
export const TREE_GROUP_FADE_MS = 180;

/**
 * What a tree's selection holds, by mode.
 *
 * A union rather than one loose value so `single` can never be handed an array
 * and `multiple` never a lone string — the root keeps one of these per render.
 */
export type TreeSelectionState =
	| { mode: "none" }
	| { mode: "single"; value: string | null }
	| { mode: "multiple"; value: readonly string[] };

/**
 * Opens a closed branch or closes an open one. Always a new array, so a caller's
 * frozen or controlled list is never written to.
 */
export function toggleExpanded(expanded: readonly string[], value: string): string[] {
	return expanded.includes(value) ? expanded.filter((item) => item !== value) : [...expanded, value];
}

/**
 * The selection after a row is pressed.
 *
 * `single` keeps a re-pressed row selected rather than clearing it — the rule
 * `Radio.Group` keeps, so a tap can never leave the tree with nothing chosen
 * by accident. `multiple` toggles. `none` never changes.
 */
export function resolveSelection(selection: TreeSelectionState, value: string): TreeSelectionState {
	switch (selection.mode) {
		case "none":
			return selection;
		case "single":
			return { mode: "single", value };
		case "multiple":
			return { mode: "multiple", value: toggleExpanded(selection.value, value) };
	}
}

/** Whether a node is in the selection. Always false under `none`. */
export function isNodeSelected(selection: TreeSelectionState, value: string): boolean {
	switch (selection.mode) {
		case "none":
			return false;
		case "single":
			return selection.value === value;
		case "multiple":
			return selection.value.includes(value);
	}
}

/** What a press on a row's body does. The indicator always toggles; this is the rest of the row. */
export type TreeRowPress = { toggle: boolean; select: boolean };

/**
 * Settles what a press on the row does.
 *
 * A leaf only ever selects. A branch toggles when `expandOnPress` is on, and
 * selects as well whenever the tree selects — so `expandOnPress={false}` makes
 * the row select-only and leaves opening to the indicator.
 */
export function resolveTreeRowPress({
	isBranch,
	expandOnPress,
	selectionMode,
}: {
	isBranch: boolean;
	expandOnPress: boolean;
	selectionMode: TreeSelectionMode;
}): TreeRowPress {
	return { toggle: isBranch && expandOnPress, select: selectionMode !== "none" };
}

/**
 * How far a row moves in for its depth, in points.
 *
 * `level` is one-based — a top-level row is level 1 and sits at the edge — so
 * the offset is `(level - 1) * indent`. Anything at or above the root, and a
 * negative indent, clamp to zero.
 */
export function resolveTreeIndent(level: number, indent: number): number {
	return Math.max(0, level - 1) * Math.max(0, indent);
}

/**
 * Where a branch's guide line starts, in points from the tree's start edge.
 *
 * Centred under the branch's own indicator: the row inset, the branch's indent,
 * half the indicator column, less half the hairline. A child row sits one indent
 * deeper, so the line runs down through the space its children were moved in by.
 */
export function resolveTreeLineOffset({
	level,
	indent,
	size,
}: {
	level: number;
	indent: number;
	size: TreeSize;
}): number {
	return TREE_ROW_INSET + resolveTreeIndent(level, indent) + TREE_INDICATOR_WIDTH[size] / 2 - 0.5;
}

/**
 * The indicator's rotation, in degrees.
 *
 * In right-to-left layouts the chevron is mirrored to point at the label, so it
 * turns the other way to reach the same "down".
 */
export function resolveTreeIndicatorRotation({ isExpanded, isRTL }: { isExpanded: boolean; isRTL: boolean }): number {
	if (!isExpanded) return TREE_INDICATOR_ROTATION.collapsed;
	return isRTL ? -TREE_INDICATOR_ROTATION.expanded : TREE_INDICATOR_ROTATION.expanded;
}

export type TreeHitSlop = { top: number; bottom: number; left: number; right: number };

/**
 * The slop that grows the indicator's column out to {@link TREE_MIN_TOUCH} on
 * each axis. Symmetric, so it never needs to know which way the layout runs.
 */
export function resolveTreeIndicatorHitSlop(size: TreeSize): TreeHitSlop {
	const horizontal = Math.max(0, TREE_MIN_TOUCH - TREE_INDICATOR_WIDTH[size]) / 2;
	const vertical = Math.max(0, TREE_MIN_TOUCH - TREE_ROW_HEIGHT[size]) / 2;
	return { top: vertical, bottom: vertical, left: horizontal, right: horizontal };
}

/**
 * Whether an item is disabled. A tree that names `isDisabled` either way wins over
 * an item's own — `Radio.Group`'s and `Steps`' ladder.
 */
export function resolveTreeDisabled(rootIsDisabled: boolean | undefined, itemIsDisabled: boolean | undefined): boolean {
	return rootIsDisabled ?? itemIsDisabled ?? false;
}

/** Theme token a row's label and composed icon carry. */
export function resolveTreeForeground({ isSelected }: { isSelected: boolean }): "foreground" | "accent-foreground" {
	return isSelected ? "accent-foreground" : "foreground";
}

/** Theme token the indicator carries — a step quieter than the label, until the row is selected. */
export function resolveTreeIndicatorForeground({
	isSelected,
}: {
	isSelected: boolean;
}): "muted-foreground" | "accent-foreground" {
	return isSelected ? "accent-foreground" : "muted-foreground";
}

/** A custom action VoiceOver and TalkBack list on a branch. */
export type TreeAccessibilityAction = { name: "expand" | "collapse"; label: string };

/** What a row's trigger tells assistive technology. */
export type TreeAccessibility = {
	role: "button";
	state: { disabled: boolean; expanded?: boolean; selected?: boolean };
	value: { text: string };
	actions: TreeAccessibilityAction[];
};

/**
 * Settles what a row announces.
 *
 * `expanded` only on a branch — a leaf announcing "collapsed" invites a gesture
 * that does nothing. `selected` only when the tree selects. The level is the
 * value, so VoiceOver reads "src, Level 2". A branch offers the one custom action
 * that applies; a disabled one offers none.
 */
export function resolveTreeAccessibility({
	isBranch,
	isExpanded,
	isSelected,
	selectionMode,
	isDisabled,
	level,
}: {
	isBranch: boolean;
	isExpanded: boolean;
	isSelected: boolean;
	selectionMode: TreeSelectionMode;
	isDisabled: boolean;
	level: number;
}): TreeAccessibility {
	const state: TreeAccessibility["state"] = { disabled: isDisabled };
	if (isBranch) state.expanded = isExpanded;
	if (selectionMode !== "none") state.selected = isSelected;

	const actions: TreeAccessibilityAction[] =
		isBranch && !isDisabled
			? [isExpanded ? { name: "collapse", label: "Collapse" } : { name: "expand", label: "Expand" }]
			: [];

	return { role: "button", state, value: { text: `Level ${level}` }, actions };
}

/** Whether a custom accessibility action should toggle the branch. An action that would change nothing does not. */
export function resolveTreeAccessibilityAction(actionName: string, isExpanded: boolean): boolean {
	if (actionName === "expand") return !isExpanded;
	if (actionName === "collapse") return isExpanded;
	return false;
}

/**
 * Styling for every part of a tree.
 *
 * One slotted `tv()`, because the parts cannot import the root without closing a
 * cycle (AGENTS.md rule 3) yet all of them read the same `size`.
 *
 * **A row is two layers.** `trigger` is the outer row — the selected fill, the
 * height, the disabled fade, the indent. `press` is the `Pressable` inside it,
 * which never carries an opacity: `Pressable`'s `Animated.View` owns `opacity`
 * every frame. The indicator and `Tree.Actions` sit beside `press`, not in it, so
 * neither press reaches the row.
 *
 * **Start and end only.** No slot names `left` or `right`, and a test holds it,
 * so the whole tree mirrors under right-to-left.
 *
 * No slot worn by a `View` carries `text-*` (rule 1). Free of React Native imports
 * so it stays reachable from `bun test`.
 */
export const treeVariants = tv({
	slots: {
		/** The list. */
		root: "w-full",
		/** One node and, while it is open, its group. */
		item: "w-full",
		/** The row: fill, height, fade. Its start padding is an inline style, because it grows with depth. */
		trigger: "w-full flex-row items-center rounded-md pe-2",
		/** The `Pressable` body of the row. Carries no opacity of its own. */
		press: "min-w-0 flex-1 flex-row items-center self-stretch",
		/** The column the chevron turns inside — or the same width of nothing, on a leaf. */
		indicator: "items-center justify-center self-stretch",
		/** Edge length every glyph on a row inherits. */
		glyph: "",
		/** The leading glyph's box. */
		icon: "items-center justify-center",
		/** The row's name. Carries its own colour — a `View` cannot cascade one. */
		label: "min-w-0 flex-1",
		/** Trailing content, outside the row's tap target. */
		actions: "flex-row items-center gap-2 ps-2",
		/** The children of an open branch. */
		group: "w-full",
		/** A branch's guide — a hairline down its group, under its indicator. */
		line: "absolute top-0 bottom-0 w-px bg-border",
	},
	variants: {
		size: {
			sm: { trigger: "min-h-9", press: "gap-1.5", indicator: "w-5", glyph: "size-icon-xs" },
			md: { trigger: "min-h-11", press: "gap-2", indicator: "w-6", glyph: "size-icon-sm" },
		},
		isSelected: {
			true: { trigger: "bg-accent", label: "text-accent-foreground" },
			false: { label: "text-foreground" },
		},
		// The empty `false` branch is load-bearing typing: a map with only `true`
		// types the prop as `true` rather than `boolean`.
		isDisabled: { true: { trigger: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		size: TREE_DEFAULT_SIZE,
		isSelected: false,
		isDisabled: false,
	},
});

export type TreeVariantProps = VariantProps<typeof treeVariants>;
