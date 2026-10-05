import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

export const MENU_PLACEMENTS = ["top", "bottom"] as const;
export const MENU_ALIGNS = ["start", "center", "end"] as const;
export const MENU_ITEM_VARIANTS = ["default", "destructive"] as const;
export const MENU_RADIO_INDICATORS = ["check", "dot"] as const;

export type MenuPlacement = (typeof MENU_PLACEMENTS)[number];
export type MenuAlign = (typeof MENU_ALIGNS)[number];
export type MenuItemVariant = (typeof MENU_ITEM_VARIANTS)[number];
export type MenuRadioIndicator = (typeof MENU_RADIO_INDICATORS)[number];

/** Where the panel is anchored, in window coordinates. A zero-size rect is a point. */
export type MenuAnchorRect = { x: number; y: number; width: number; height: number };

/** A screen edge's safe-area inset, in points. */
export type MenuInsets = { top: number; right: number; bottom: number; left: number };

/** `align` with RTL already applied — the edge the panel lines up with on screen. */
export type MenuPhysicalAlign = "left" | "center" | "right";

/** Gap between the anchor and the panel, in points. */
export const MENU_DEFAULT_OFFSET = 6;

/** What the panel keeps clear of the safe area on every side, in points. */
export const MENU_EDGE_MARGIN = 8;

/** The narrowest a panel resolves to when nothing names a width. */
export const MENU_DEFAULT_MIN_WIDTH = 200;

/** The scale the panel grows from on enter and shrinks to on exit. */
export const MENU_ENTER_SCALE = 0.96;

/** How long the panel takes to appear and to leave, in milliseconds. */
export const MENU_MOTION = { enterMs: 160, exitMs: 120 } as const;

/**
 * A row's press: the fill fades in fast and out slower, and the row dips to
 * `scale`. Both read one shared value.
 */
export const MENU_PRESS = { inMs: 90, outMs: 160, scale: 0.98 } as const;

/** How far a tap may travel before it stops being a tap — a scroll, in a long menu. */
export const MENU_TAP_MAX_DISTANCE = 10;

/** Where the sub-trigger's chevron points at each end of the travel, in degrees. */
export const MENU_SUB_ROTATION = { collapsed: 0, expanded: 90 } as const;

/**
 * The submenu's spring — `Collapsible`'s, restated rather than imported so
 * `delacour add menu` copies one folder. Critically damped, because an
 * overshoot in height flashes the panel behind the rows.
 */
export const MENU_SUB_SPRING = { damping: 26, mass: 0.4, stiffness: 400 } as const;

/** Theme token a row's icon is drawn in, per variant. */
export const MENU_ICON_TOKEN: Record<MenuItemVariant, string> = {
	default: "popover-foreground",
	destructive: "destructive",
};

/** Theme token an indicator (check, chevron) is drawn in. */
export const MENU_INDICATOR_TOKEN = "popover-foreground";

/** The accessibility hint a trigger carries. */
export const MENU_TRIGGER_HINT = "Opens a menu";

/** `align` as a screen edge: start and end swap under RTL, center does not. */
export function resolveMenuPhysicalAlign(align: MenuAlign, isRTL: boolean): MenuPhysicalAlign {
	if (align === "center") return "center";
	const isStart = align === "start";
	return isStart !== isRTL ? "left" : "right";
}

export type MenuPlacementInput = {
	anchor: MenuAnchorRect;
	/** The panel's size — its resolved width and its measured (or estimated) height. */
	content: { width: number; height: number };
	window: { width: number; height: number };
	insets: MenuInsets;
	placement: MenuPlacement;
	align: MenuAlign;
	offset: number;
	isRTL: boolean;
};

export type MenuPlacementResult = {
	/** The panel's top edge, for a panel below the anchor. */
	top: number;
	/**
	 * The distance from the window's bottom to the panel's bottom edge — what a
	 * panel above the anchor is positioned by, so it grows away from the anchor
	 * when its content does.
	 */
	bottom: number;
	left: number;
	/** The side it actually opened on, after any flip. */
	placement: MenuPlacement;
	/** The room on that side, inside the safe area and the margin. Never negative. */
	maxHeight: number;
};

/**
 * Where the panel goes.
 *
 * **Vertical.** The requested side wins when the content fits there; otherwise it
 * flips to the other side if the content fits there; otherwise it takes the
 * larger side and `maxHeight` caps it, so the rows scroll. Room is measured
 * inside the safe area plus {@link MENU_EDGE_MARGIN}.
 *
 * **Horizontal.** `align` lines an edge (or the centre) up with the anchor's —
 * start and end swap under RTL — and the result is clamped inside the safe area
 * plus the margin. A panel wider than the room pins to the left edge.
 *
 * A zero-size anchor (a long-press point) runs through the same arithmetic with
 * no special case: its edges coincide.
 *
 * Pure, and the one place the geometry lives — when Popover lands, Menu.Content
 * moves onto it and this resolver moves with it.
 */
export function resolveMenuPlacement({
	anchor,
	content,
	window,
	insets,
	placement,
	align,
	offset,
	isRTL,
}: MenuPlacementInput): MenuPlacementResult {
	const topBound = insets.top + MENU_EDGE_MARGIN;
	const bottomBound = window.height - insets.bottom - MENU_EDGE_MARGIN;
	const belowStart = anchor.y + anchor.height + offset;
	const aboveEnd = anchor.y - offset;

	const room: Record<MenuPlacement, number> = {
		bottom: Math.max(0, bottomBound - belowStart),
		top: Math.max(0, aboveEnd - topBound),
	};
	const other: MenuPlacement = placement === "bottom" ? "top" : "bottom";

	let side: MenuPlacement;
	if (content.height <= room[placement]) side = placement;
	else if (content.height <= room[other]) side = other;
	else side = room[placement] >= room[other] ? placement : other;

	const maxHeight = room[side];
	const height = Math.min(content.height, maxHeight);
	const top = side === "bottom" ? belowStart : aboveEnd - height;
	const bottom = window.height - (top + height);

	const physical = resolveMenuPhysicalAlign(align, isRTL);
	let left: number;
	if (physical === "left") left = anchor.x;
	else if (physical === "right") left = anchor.x + anchor.width - content.width;
	else left = anchor.x + anchor.width / 2 - content.width / 2;

	const minLeft = insets.left + MENU_EDGE_MARGIN;
	const maxLeft = window.width - insets.right - MENU_EDGE_MARGIN - content.width;
	left = maxLeft < minLeft ? minLeft : Math.min(Math.max(left, minLeft), maxLeft);

	return { bottom, left, maxHeight, placement: side, top };
}

/**
 * The translate that makes a centre-origin scale look like it grows out of the
 * anchor's side, at the panel's smallest. The worklet multiplies it by
 * `1 - progress`, so it is zero once the panel has arrived.
 *
 * React Native has no `transformOrigin` that Reanimated animates reliably on
 * both platforms, so the origin is approximated: a panel below grows from its
 * top edge, a panel above from its bottom, and a start-aligned one from its
 * leading edge.
 */
export function resolveMenuOrigin({
	placement,
	align,
	width,
	height,
}: {
	placement: MenuPlacement;
	align: MenuPhysicalAlign;
	width: number;
	height: number;
}): { x: number; y: number } {
	const shrink = 1 - MENU_ENTER_SCALE;
	const y = ((placement === "bottom" ? -1 : 1) * shrink * height) / 2;
	const x = align === "center" ? 0 : ((align === "left" ? -1 : 1) * shrink * width) / 2;
	return { x, y };
}

/**
 * The panel's width: the caller's `width`, or the trigger's floored at
 * {@link MENU_DEFAULT_MIN_WIDTH}; then floored by `minWidth`; then capped by
 * `maxWidth` — the room between the safe-area edges — so it never runs off screen.
 */
export function resolveMenuWidth({
	width,
	minWidth,
	maxWidth,
	triggerWidth,
}: {
	width?: number;
	minWidth?: number;
	maxWidth?: number;
	triggerWidth: number;
}): number {
	const base = width ?? Math.max(triggerWidth, MENU_DEFAULT_MIN_WIDTH);
	const floored = Math.max(base, minWidth ?? 0);
	return maxWidth === undefined ? floored : Math.min(floored, maxWidth);
}

/** The group's next value when a radio row is chosen. A radio never clears, so re-choosing keeps it. */
export function resolveRadioNext(_current: string | undefined, value: string): string {
	return value;
}

/** The kinds of row a menu has. */
export type MenuRowKind = "item" | "checkbox" | "radio" | "sub-trigger";

const CLOSE_ON_SELECT: Record<MenuRowKind, boolean> = {
	checkbox: false,
	item: true,
	radio: true,
	"sub-trigger": false,
};

/**
 * Whether choosing a row closes the menu: an item and a radio do, a checkbox does
 * not (several are usually toggled in one visit), and a sub-trigger only expands.
 * An explicit `isClosedOnSelect` wins.
 */
export function resolveCloseOnSelect(kind: MenuRowKind, explicit?: boolean): boolean {
	return explicit ?? CLOSE_ON_SELECT[kind];
}

export type MenuItemAccessibilityInput =
	| { kind: "item"; isDisabled: boolean }
	| { kind: "checkbox"; isDisabled: boolean; isChecked: boolean }
	| { kind: "radio"; isDisabled: boolean; isSelected: boolean }
	| { kind: "sub-trigger"; isDisabled: boolean; isExpanded: boolean };

export type MenuItemAccessibilityState = {
	disabled: boolean;
	checked?: boolean;
	selected?: boolean;
	expanded?: boolean;
};

/** The `accessibilityState` a row announces — one source, so the matrix is testable. */
export function resolveMenuItemAccessibility(input: MenuItemAccessibilityInput): MenuItemAccessibilityState {
	switch (input.kind) {
		case "item":
			return { disabled: input.isDisabled };
		case "checkbox":
			return { checked: input.isChecked, disabled: input.isDisabled };
		case "radio":
			return { disabled: input.isDisabled, selected: input.isSelected };
		case "sub-trigger":
			return { disabled: input.isDisabled, expanded: input.isExpanded };
		default:
			return { disabled: false };
	}
}

/**
 * Styling for every part of a menu.
 *
 * One slotted `tv()`, because the parts cannot import each other without closing
 * a cycle (AGENTS.md rule 3) and all of them read the same row axes.
 *
 * **`background` is `bg-popover`, never `bg-overlay`.** `overlay` is the
 * translucent scrim colour, and a panel painted in it is a see-through card.
 * The scrim slot wears it instead.
 *
 * **`itemFill` is the row's pressed background**, an absolute layer whose
 * opacity the press drives. There is no wash on top: the fill is the feedback.
 *
 * **The disabled fade lands on `item`**, a plain `Animated.View` that owns only
 * `transform`, so a class opacity there is not overwritten.
 *
 * No slot worn by a `View` carries `text-*` (rule 1). Free of React Native
 * imports so it stays reachable from `bun test`.
 */
export const menuVariants = tv({
	slots: {
		/**
		 * The positioned, animated layer. Casts the panel's shadow, so it carries no
		 * `overflow-hidden` — iOS clips a shadow to a clipping view's own bounds.
		 */
		panel: "absolute shadow-lg",
		/** The panel's frame: corner, hairline and clip. Its surface is `background`. */
		content: "overflow-hidden rounded-lg border border-border",
		/** The panel's surface, drawn behind the scroller. */
		background: "absolute inset-0 bg-popover",
		/** The full-screen tint behind the panel, when `hasScrim`. */
		scrim: "absolute inset-0 bg-overlay",
		/** The scroller's padding, around the rows. */
		scroll: "p-1",
		/** One row. */
		item: "min-h-11 flex-row items-center gap-3 rounded-md px-3 py-2",
		/** The row's pressed fill. Its opacity is an animated style. */
		itemFill: "absolute inset-0 rounded-md bg-accent",
		/** The label-and-description column. */
		itemContent: "min-w-0 flex-1 justify-center gap-0.5",
		itemLabel: "text-popover-foreground text-sm",
		itemDescription: "text-muted-foreground text-xs",
		itemShortcut: "ms-auto text-muted-foreground text-xs",
		/** Edge length of a row's glyph — 18pt, the reserved icon column. */
		itemIcon: "size-icon-md",
		/** The section heading. */
		label: "px-3 pt-2 pb-1 font-medium text-muted-foreground text-xs",
		/** The box an indicator (check, dot, chevron) sits in — the icon column's footprint. */
		indicator: "size-icon-md items-center justify-center",
		/** The radio `dot` indicator. */
		indicatorDot: "size-1.5 rounded-full bg-popover-foreground",
		/** The rows a submenu discloses, stepped in from the trigger. */
		subContent: "ps-3",
		/** The submenu's measured clip. Its height is an animated style. */
		subClip: "overflow-hidden",
		/** The submenu's measured inner layer — out of flow so it measures its content alone. */
		subInner: "absolute top-0 right-0 left-0",
		/** The separator's spacing. */
		separator: "my-1",
	},
	variants: {
		variant: {
			default: {},
			destructive: {
				itemFill: "bg-destructive-soft",
				itemLabel: "text-destructive",
			},
		},
		isInset: {
			true: { label: "ps-[42px]" },
			false: {},
		},
		isDisabled: {
			true: { item: "opacity-50" },
			false: {},
		},
	},
	defaultVariants: {
		variant: "default",
		isInset: false,
		isDisabled: false,
	},
});

export type MenuVariantProps = VariantProps<typeof menuVariants>;
