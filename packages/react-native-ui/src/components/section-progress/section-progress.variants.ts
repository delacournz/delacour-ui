import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** Where the pill floats, against the safe area of the caller's container. */
export const SECTION_PROGRESS_PLACEMENTS = [
	"bottom-center",
	"top-center",
	"bottom-start",
	"bottom-end",
	"top-start",
	"top-end",
] as const;

/** The colour a section's marker, and the ring while that section is active, are painted in. */
export const SECTION_PROGRESS_COLORS = ["foreground", "primary", "success", "warning", "info", "destructive"] as const;

export type SectionProgressPlacement = (typeof SECTION_PROGRESS_PLACEMENTS)[number];
export type SectionProgressColor = (typeof SECTION_PROGRESS_COLORS)[number];
export type SectionProgressPanelDirection = "up" | "down";

export const SECTION_PROGRESS_DEFAULT_PLACEMENT: SectionProgressPlacement = "bottom-center";
export const SECTION_PROGRESS_DEFAULT_COLOR: SectionProgressColor = "foreground";

/** The ring's edge, in points. */
export const SECTION_PROGRESS_RING_SIZE = 20;
/** The ring's stroke, in points. The track and the fill share it. */
export const SECTION_PROGRESS_RING_STROKE = 2.5;

/** One row of the panel, in points — `min-h-11` on the `item` slot, a touch target tall. */
export const SECTION_PROGRESS_ITEM_HEIGHT = 44;
/** The list's padding above and below its rows — `py-1` on the `list` slot. */
export const SECTION_PROGRESS_PANEL_PADDING = 4;
/** How many rows the panel shows before its list scrolls. */
export const SECTION_PROGRESS_PANEL_ROWS = 6;

/** How long the ring takes to ease onto the settled value once scrolling stops. */
export const SECTION_PROGRESS_RING_SETTLE_MS = 180;
/** A progress step larger than this is a jump — a `scrollTo`, a new `progress` — and eases rather than snaps. */
export const SECTION_PROGRESS_RING_JUMP = 0.1;
/** The pill's one-time fade in. */
export const SECTION_PROGRESS_REVEAL_MS = 200;
/** The label's cross-fade when the section changes. */
export const SECTION_PROGRESS_LABEL_FADE_MS = 120;
/** How long the pill takes to resize to a new section's title. */
export const SECTION_PROGRESS_LABEL_RESIZE_MS = 220;
/** How far, in points, a title slides as it leaves and the next arrives. */
export const SECTION_PROGRESS_LABEL_SHIFT = 8;

/** One `SectionProgress.Item`, as the root reads it from its children. */
export type SectionProgressEntry = {
	value: string;
	title: string;
	color: SectionProgressColor | undefined;
};

/** The safe-area insets `resolvePlacementStyle` reads. */
export type SectionProgressInsets = { top: number; bottom: number; left: number; right: number };

/** The positioned box's style — one vertical edge, a symmetric gutter, and the cross-axis alignment. */
export type SectionProgressPlacementStyle = {
	top?: number;
	bottom?: number;
	start: number;
	end: number;
	alignItems: "center" | "flex-start" | "flex-end";
};

/**
 * Styling for every part of a section progress pill.
 *
 * One slotted `tv()` because the root, the pill, the ring, the panel and the
 * item files all read it and cannot import each other's roots (AGENTS.md rule 3).
 *
 * **The panel is the pill grown into a card.** Open, the pill is drawn inside
 * the card at its edge nearest the screen's — the bottom for a `bottom-*`
 * placement, so `flex-col-reverse` — rather than floating beside a separate
 * card. Closed, the pill wears its own capsule.
 *
 * **Every row is a touch target tall** (`min-h-11`), and the list's max height
 * is six of them plus its padding; a test reads both numbers back out of the
 * slots, so a retuned row moves the scroll threshold with it.
 *
 * Text colour sits on the label slots, never the pressables (rule 1). Free of
 * React Native imports so it stays unit-testable.
 */
export const sectionProgressVariants = tv({
	slots: {
		/** The overlay: the caller's whole container, letting touches through. Takes `className`. */
		root: "absolute inset-0",
		/** A transparent full-cover press target behind the open panel. */
		scrim: "absolute inset-0",
		/** The box at the placement's edge, holding the pill or the panel. */
		stack: "absolute",
		/** The closed pill: the ring and the label in a capsule. */
		pill: "min-h-11 flex-row items-center gap-2 rounded-full border border-border bg-card py-2 ps-2.5 pe-4",
		/** The pill's row inside the open panel — the same content, without the capsule. */
		pillRow: "min-h-11 flex-row items-center gap-2 py-2 ps-2.5 pe-4",
		/** The Skia ring's box. Hidden from assistive technology. */
		ring: "size-5",
		/** The box the pill's title sits in — eased to each title's width, clipping the titles that slide through it. */
		labelBox: "overflow-hidden",
		/** The section title in the pill — one line, truncated. */
		label: "shrink text-foreground",
		/** The open card. */
		panel: "w-72 max-w-full overflow-hidden rounded-lg border border-border bg-card",
		/** The scrolling list of sections. */
		list: "py-1",
		/** One section row. */
		item: "min-h-11 flex-row items-center gap-3 px-3",
		/** A section's title. */
		itemLabel: "flex-1",
		/** The coloured dot before a section's title. */
		itemMarker: "size-2 rounded-full",
		/** The rule between the list and the pill row. */
		divider: "h-px bg-border",
	},
	variants: {
		placement: {
			"bottom-center": { panel: "flex-col-reverse" },
			"bottom-start": { panel: "flex-col-reverse" },
			"bottom-end": { panel: "flex-col-reverse" },
			"top-center": { panel: "flex-col" },
			"top-start": { panel: "flex-col" },
			"top-end": { panel: "flex-col" },
		},
		isActive: {
			true: { item: "bg-muted", itemLabel: "text-foreground" },
			false: { itemLabel: "text-muted-foreground" },
		},
		color: {
			foreground: { itemMarker: "bg-foreground" },
			primary: { itemMarker: "bg-primary" },
			success: { itemMarker: "bg-success" },
			warning: { itemMarker: "bg-warning" },
			info: { itemMarker: "bg-info" },
			destructive: { itemMarker: "bg-destructive" },
		},
	},
	defaultVariants: {
		placement: SECTION_PROGRESS_DEFAULT_PLACEMENT,
		isActive: false,
		color: SECTION_PROGRESS_DEFAULT_COLOR,
	},
});

export type SectionProgressVariantProps = VariantProps<typeof sectionProgressVariants>;

/** The ring's radius and circumference — the stroke sits wholly inside the box. */
export function resolveRingGeometry(size: number, stroke: number): { radius: number; circumference: number } {
	const radius = (size - stroke) / 2;
	return { radius, circumference: 2 * Math.PI * radius };
}

/**
 * The box the ring's stroke is centred on: inset half a stroke from the ring's own box, so the
 * stroke sits wholly inside it, as `resolveRingGeometry`'s radius does.
 */
export function resolveRingOval(size: number, stroke: number): { x: number; y: number; width: number; height: number } {
	const inset = stroke / 2;
	const diameter = size - stroke;
	return { x: inset, y: inset, width: diameter, height: diameter };
}

/**
 * How far round the fill's trim reaches: `progress`, clamped to 0..1. A NaN — a progress read
 * before layout — draws an empty ring rather than none at all.
 */
export function resolveRingTrimEnd(progress: number): number {
	"worklet";
	return Number.isNaN(progress) ? 0 : Math.min(1, Math.max(0, progress));
}

/**
 * Whether the pill is showing. Latches: once the reader scrolls past `revealAt`
 * it never hides again, so it does not flicker in and out near the top.
 * `revealAt` 0 (or less) is always visible.
 */
export function resolveRevealed(scrollY: number, revealAt: number, wasRevealed: boolean): boolean {
	"worklet";
	return wasRevealed || revealAt <= 0 || scrollY >= revealAt;
}

/**
 * Where the pill's box sits: `offset` points in from the safe-area edge it is
 * placed on, with a symmetric gutter either side so `start` and `end` mirror
 * correctly under RTL. The box spans the gutter's width, and `alignItems`
 * puts the pill at its start, centre or end.
 */
export function resolvePlacementStyle(
	placement: SectionProgressPlacement,
	insets: SectionProgressInsets,
	offset: number
): SectionProgressPlacementStyle {
	const gutter = Math.max(insets.left, insets.right) + offset;
	const alignItems = placement.endsWith("start") ? "flex-start" : placement.endsWith("end") ? "flex-end" : "center";
	const vertical = placement.startsWith("top") ? { top: insets.top + offset } : { bottom: insets.bottom + offset };
	return { ...vertical, start: gutter, end: gutter, alignItems };
}

/** Which way the panel grows from the pill: away from the edge it is pinned to. */
export function resolvePanelDirection(placement: SectionProgressPlacement): SectionProgressPanelDirection {
	return placement.startsWith("top") ? "down" : "up";
}

/** The list's max height: six rows and its padding. Past that it scrolls. */
export function resolvePanelMaxHeight(
	rows: number = SECTION_PROGRESS_PANEL_ROWS,
	itemHeight: number = SECTION_PROGRESS_ITEM_HEIGHT,
	padding: number = SECTION_PROGRESS_PANEL_PADDING
): number {
	return rows * itemHeight + padding * 2;
}

/**
 * The pill's label: the active section's title, or the first section's before
 * any is active — a screen whose header sits above its first section is still
 * reading that section.
 */
export function resolveSectionLabel(items: readonly SectionProgressEntry[], value: string | undefined): string {
	return (items.find((item) => item.value === value) ?? items[0])?.title ?? "";
}

/** The ring's colour: the active section's, or the default. */
export function resolveSectionColor(
	items: readonly SectionProgressEntry[],
	value: string | undefined
): SectionProgressColor {
	return items.find((item) => item.value === value)?.color ?? SECTION_PROGRESS_DEFAULT_COLOR;
}

/** What VoiceOver reads after the pill's name: "Pricing, 42 percent". */
export function resolveSectionProgressAccessibilityValue(title: string, progress: number): string {
	const percent = resolveProgressPercent(progress);
	return title === "" ? `${percent} percent` : `${title}, ${percent} percent`;
}

/** The theme token a section colour paints with — read by `useThemeColor` for the ring. */
export function resolveSectionColorToken(color: SectionProgressColor): string {
	return color;
}

/**
 * How the ring follows a new progress. A scroll moves it a hair per frame and
 * it tracks directly; a jump — a picked section, a `progress` set from outside —
 * eases over `SECTION_PROGRESS_RING_SETTLE_MS` instead of snapping.
 */
export function resolveRingTransition(previous: number, next: number): "track" | "ease" {
	"worklet";
	return Math.abs(next - previous) > SECTION_PROGRESS_RING_JUMP ? "ease" : "track";
}

/** Progress as a whole percent, 0–100. What the screen reader hears, and only ever changes in whole steps. */
export function resolveProgressPercent(progress: number): number {
	"worklet";
	if (Number.isNaN(progress)) return 0;
	return Math.round(Math.min(1, Math.max(0, progress)) * 100);
}

/**
 * Where the panel scales from: the pill's own edge and side. `transformOrigin`
 * has no `start`/`end`, so the side is resolved against the layout direction.
 */
export function resolvePanelTransformOrigin(placement: SectionProgressPlacement, isRTL: boolean): string {
	const vertical = placement.startsWith("top") ? "top" : "bottom";
	const leading = isRTL ? "right" : "left";
	const trailing = isRTL ? "left" : "right";
	const horizontal = placement.endsWith("start") ? leading : placement.endsWith("end") ? trailing : "center";
	return `${horizontal} ${vertical}`;
}

/** The pill label's width cap: sixty percent of the window, so the pill never spans the screen. */
export function resolveLabelMaxWidth(windowWidth: number): number {
	return Math.round(windowWidth * 0.6);
}

/**
 * The width the pill's label box animates to: the title as laid out, rounded up so the last
 * glyph is never clipped, and capped at `resolveLabelMaxWidth`. A missing measure is 0.
 */
export function resolveLabelWidth(textWidth: number, maxWidth: number): number {
	if (Number.isNaN(textWidth) || textWidth <= 0) return 0;
	return Math.ceil(Math.min(textWidth, maxWidth));
}

/**
 * Which way the titles slide when the section changes: forward — the old one up and out, the new
 * one up from below — for a later section, back for an earlier one. Coming from no section, or
 * to one not among the items, is forward.
 */
export function resolveLabelStep(previous: number, next: number): "forward" | "back" {
	return previous >= 0 && next >= 0 && next < previous ? "back" : "forward";
}
