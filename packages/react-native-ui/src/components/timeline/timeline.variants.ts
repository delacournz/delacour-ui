import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { TextSize } from "../text/text.variants";

/** What kind of event an item is. `default` carries no kind; the others are the house state colours. */
export const TIMELINE_TONES = ["default", "info", "success", "warning", "destructive"] as const;

/**
 * How an event's marker and content are drawn. `dot` is a small dot; `icon` a
 * circle holding the caller's glyph; `numbered` a circle holding the position;
 * `card` a dot beside content on a `Surface`; `compact` a dot with half the gaps.
 */
export const TIMELINE_VARIANTS = ["dot", "icon", "numbered", "card", "compact"] as const;

export const TIMELINE_SIZES = ["sm", "md"] as const;

/** `vertical` stacks events down a rail; `horizontal` lays them out as a swipeable strip of columns. */
export const TIMELINE_ORIENTATIONS = ["vertical", "horizontal"] as const;

/** Where an event stands relative to the value. See {@link resolveTimelineStatus}. */
export const TIMELINE_STATUSES = ["completed", "current", "upcoming"] as const;

export type TimelineTone = (typeof TIMELINE_TONES)[number];
export type TimelineVariant = (typeof TIMELINE_VARIANTS)[number];
export type TimelineSize = (typeof TIMELINE_SIZES)[number];
export type TimelineOrientation = (typeof TIMELINE_ORIENTATIONS)[number];
export type TimelineStatus = (typeof TIMELINE_STATUSES)[number];

/**
 * The axes a timeline falls back to when the call site names none. Named once
 * because the root's destructure and `defaultVariants` both read them; a test
 * pins the pair.
 */
export const TIMELINE_DEFAULT_VARIANT: TimelineVariant = "dot";
export const TIMELINE_DEFAULT_SIZE: TimelineSize = "md";
export const TIMELINE_DEFAULT_ORIENTATION: TimelineOrientation = "vertical";

/** The value that leaves every event upcoming. */
export const TIMELINE_DEFAULT_VALUE = -1;

/** A horizontal column's width when the caller names none, in points. */
export const TIMELINE_COLUMN_WIDTH = 160;

/** The width a horizontal column with no content collapses to — a tick on the rail. */
export const TIMELINE_TICK_WIDTH = 24;

/** The `Text` size step each timeline size hands `Timeline.Title`. */
export const TIMELINE_TITLE_TEXT_SIZE: Record<TimelineSize, TextSize> = { sm: "sm", md: "md" };

/** The step for the date, description, meta and stat label — one below the title. */
export const TIMELINE_DESCRIPTION_TEXT_SIZE: Record<TimelineSize, TextSize> = { sm: "xs", md: "sm" };

/** How long the reading edge takes to move a horizontal title's colour, in ms. */
export const TIMELINE_READING_EDGE_MS = 150;

/**
 * Styling for every part of a timeline.
 *
 * **The rail is laid out, never measured.** A vertical item is a row of
 * `[aside] [track] [content] [trailing]`; its track is a column of
 * `[indicator box] [rail]`, the rail `flex-1` down whatever height the content
 * gives the row, so it reaches the next item's indicator without an `onLayout`.
 * A horizontal item is a column of `[content band] [track]`, its track a row of
 * `[indicator box] [rail]` that runs to the column's right edge, where the next
 * column's indicator begins.
 *
 * **The indicator sits in a box, and the box is what aligns.** A dot's box is one
 * title line tall, so the dot centres on the title's first line; a circle's box is
 * the circle, and the content is padded down by half the difference. A test
 * recomputes both from the classes.
 *
 * Every colour cell is a compound so that `tv` emits it after the plain variants.
 * Free of React Native imports so it stays unit-testable.
 */
export const timelineVariants = tv({
	slots: {
		/** The root's box. Takes the caller's `className`. */
		root: "w-full",
		/** The horizontal strip's scroll content. */
		strip: "flex-row items-stretch",
		/** A masthead above the first event — media, label, title. */
		masthead: "flex-row items-center gap-3 pb-4",
		mastheadText: "min-w-0 flex-1 gap-0.5",
		/** One event's box. */
		item: "",
		/** The left column beside a vertical item — a timestamp. */
		aside: "items-end",
		/** The indicator box and the rail leaving it. */
		track: "",
		/** Holds the indicator at a fixed edge, so dots and circles line up on one axis. */
		indicatorBox: "items-center justify-center",
		/** The dot or circle. */
		indicator: "items-center justify-center rounded-full border-2",
		/** The number inside a circle — a `Text`, so it owns its colour (rule 1). */
		indicatorLabel: "font-semibold",
		/** An icon or check inside a circle. */
		glyph: "",
		/** The tick an empty horizontal column draws instead of an indicator. */
		tick: "h-2 w-0.5 rounded-full",
		/** The segment leaving an event. Square-ended, so two segments never pinch. */
		rail: "",
		/** The item's text column, laid out by the item: its alignment padding and the gap below. */
		content: "min-w-0",
		/** `Timeline.Content` — the caller's grouping inside that column; a `Surface` under `card`. */
		body: "",
		/** `Timeline.Header` — title and date on one line. */
		header: "",
		title: "",
		date: "",
		description: "",
		meta: "",
		/** The right column beside a vertical item — an amount, a badge. */
		trailing: "items-end",
		stats: "flex-row flex-wrap gap-x-5 gap-y-2 pt-2",
		stat: "gap-0.5",
	},
	variants: {
		orientation: {
			vertical: {
				item: "flex-row",
				track: "items-center",
				rail: "my-1 min-h-3 w-0.5 flex-1",
				content: "flex-1",
				header: "flex-row items-baseline justify-between gap-2",
				title: "shrink",
				date: "tabular-nums",
				description: "pt-0.5",
				meta: "pt-1",
			},
			horizontal: {
				item: "flex-col",
				track: "flex-row items-center",
				rail: "mx-1 h-0.5 flex-1",
				content: "flex-1 justify-end pr-3 pb-3",
				header: "gap-0.5",
				date: "tabular-nums",
				description: "pt-0.5",
				meta: "pt-1",
			},
		},
		size: {
			sm: { item: "gap-2.5", indicatorLabel: "text-xs", glyph: "size-icon-xs", aside: "w-12" },
			md: { item: "gap-3", indicatorLabel: "text-sm", glyph: "size-icon-md", aside: "w-14" },
		},
		variant: { dot: {}, icon: {}, numbered: {}, card: {}, compact: {} },
		status: { completed: {}, current: {}, upcoming: {} },
		tone: { default: {}, info: {}, success: {}, warning: {}, destructive: {} },
		isRailComplete: {
			true: { rail: "bg-primary", tick: "bg-primary" },
			false: { rail: "bg-border", tick: "bg-border" },
		},
		isLast: { true: {}, false: {} },
	},
	compoundVariants: [
		// The indicator box: one title line for a dot, the circle itself otherwise.
		{ variant: ["dot", "card", "compact"], size: "sm", class: { indicatorBox: "size-5", indicator: "size-2.5" } },
		{ variant: ["dot", "card", "compact"], size: "md", class: { indicatorBox: "size-6", indicator: "size-3" } },
		{ variant: ["icon", "numbered"], size: "sm", class: { indicatorBox: "size-6", indicator: "size-6" } },
		{ variant: ["icon", "numbered"], size: "md", class: { indicatorBox: "size-8", indicator: "size-8" } },

		// A vertical track is as wide as its box, so every event's marker sits on one axis.
		{ orientation: "vertical", variant: ["dot", "card", "compact"], size: "sm", class: { track: "w-5" } },
		{ orientation: "vertical", variant: ["dot", "card", "compact"], size: "md", class: { track: "w-6" } },
		{ orientation: "vertical", variant: ["icon", "numbered"], size: "sm", class: { track: "w-6" } },
		{ orientation: "vertical", variant: ["icon", "numbered"], size: "md", class: { track: "w-8" } },

		// A circle is taller than the title's line: pad the text down by half the difference.
		{ orientation: "vertical", variant: ["icon", "numbered"], size: "sm", class: { content: "pt-0.5", aside: "pt-1" } },
		{ orientation: "vertical", variant: ["icon", "numbered"], size: "md", class: { content: "pt-1", aside: "pt-1.5" } },
		{ orientation: "vertical", variant: ["dot", "compact"], class: { aside: "pt-0.5" } },
		// A card's title sits behind the card's own inset, so the dot drops by it too.
		{ orientation: "vertical", variant: "card", class: { track: "pt-3", aside: "pt-3.5" } },

		// The gap between vertical events. Compact halves it; a card brings its own padding.
		{ orientation: "vertical", variant: ["dot", "icon", "numbered"], size: "sm", class: { content: "pb-4" } },
		{ orientation: "vertical", variant: ["dot", "icon", "numbered"], size: "md", class: { content: "pb-6" } },
		{ orientation: "vertical", variant: "compact", size: "sm", class: { content: "pb-2" } },
		{ orientation: "vertical", variant: "compact", size: "md", class: { content: "pb-3" } },
		{ orientation: "vertical", variant: "card", class: { content: "pb-3" } },
		{ orientation: "vertical", isLast: true, class: { content: "pb-0" } },

		// A vertical title follows progress; a horizontal one is animated by the reading edge.
		{ orientation: "vertical", status: ["completed", "current"], class: { title: "text-foreground" } },
		{ orientation: "vertical", status: "upcoming", class: { title: "text-muted-foreground" } },

		// Progress is solid, kind is tinted.
		{
			tone: "default",
			status: ["completed", "current"],
			class: { indicator: "border-primary bg-primary", indicatorLabel: "text-primary-foreground" },
		},
		{
			tone: "default",
			status: "upcoming",
			class: { indicator: "border-border bg-background", indicatorLabel: "text-muted-foreground" },
		},
		{
			tone: "info",
			class: { indicator: "border-info-soft bg-info-soft", indicatorLabel: "text-info-soft-foreground" },
		},
		{
			tone: "success",
			class: { indicator: "border-success-soft bg-success-soft", indicatorLabel: "text-success-soft-foreground" },
		},
		{
			tone: "warning",
			class: { indicator: "border-warning-soft bg-warning-soft", indicatorLabel: "text-warning-soft-foreground" },
		},
		{
			tone: "destructive",
			class: {
				indicator: "border-destructive-soft bg-destructive-soft",
				indicatorLabel: "text-destructive-soft-foreground",
			},
		},
	],
	defaultVariants: {
		orientation: TIMELINE_DEFAULT_ORIENTATION,
		size: TIMELINE_DEFAULT_SIZE,
		variant: TIMELINE_DEFAULT_VARIANT,
		status: "upcoming",
		tone: "default",
		isRailComplete: false,
		isLast: false,
	},
});

export type TimelineVariantProps = VariantProps<typeof timelineVariants>;

/**
 * Where an event stands, from its index, the timeline's value and its own override.
 *
 * Before the value is `completed`, at it `current`, after it `upcoming`.
 * `isCompleted: true` wins everywhere; `isCompleted: false` un-completes a passed
 * event but never demotes the current one, which would leave a timeline with no
 * "now".
 */
export function resolveTimelineStatus({
	step,
	value,
	isCompleted,
}: {
	step: number;
	value: number;
	isCompleted?: boolean;
}): TimelineStatus {
	if (isCompleted === true) return "completed";
	if (step === value) return "current";
	if (isCompleted === false) return "upcoming";
	return step < value ? "completed" : "upcoming";
}

/**
 * Whether the rail segment leaving `step` is filled.
 *
 * Read off the value alone, never off an event's status or override: the segment
 * between two events is drawn by the first and ends at the second, and the value
 * is the one thing both agree on — so the rail is never half filled between two
 * items, and filled segments are always a prefix of the sequence.
 */
export function isTimelineRailComplete(step: number, value: number): boolean {
	return step < value;
}

/** What an indicator draws inside itself. */
export type TimelineGlyph = "dot" | "number" | "icon" | "check";

/** The tokens and glyph one indicator is painted with. */
export type TimelineIndicator = {
	/** The indicator's fill — `bg-<fill>`. */
	fill: string;
	/** Its 2pt ring — `border-<ring>`. */
	ring: string;
	/** The number's class and the icon's colour — `text-<foreground>`. */
	foreground: string;
	glyph: TimelineGlyph;
};

const TONE_SOFT: Record<Exclude<TimelineTone, "default">, { fill: string; foreground: string }> = {
	info: { fill: "info-soft", foreground: "info-soft-foreground" },
	success: { fill: "success-soft", foreground: "success-soft-foreground" },
	warning: { fill: "warning-soft", foreground: "warning-soft-foreground" },
	destructive: { fill: "destructive-soft", foreground: "destructive-soft-foreground" },
};

function resolveGlyph(variant: TimelineVariant, status: TimelineStatus, hasIcon: boolean): TimelineGlyph {
	if (variant === "numbered") return "number";
	if (variant !== "icon") return "dot";
	if (hasIcon) return "icon";
	return status === "completed" ? "check" : "dot";
}

/**
 * How one indicator is painted.
 *
 * **Progress is solid, kind is tinted.** A default event fills `primary` once
 * reached and is a muted ring ahead of the value. A toned event is its
 * `<tone>-soft` pair whatever its progress — the rail says how far along the
 * sequence is, so the marker is free to say what kind of event it was.
 *
 * The glyph follows the variant: `numbered` draws the position, `icon` the
 * caller's glyph (a check once completed when none is given), the rest a dot.
 *
 * `timelineVariants`' `indicator` and `indicatorLabel` slots emit exactly these
 * tokens, and a test sweeps every cell — the icon's colour is handed over as a
 * token, the number's as a class, and the two must not disagree.
 */
export function resolveTimelineIndicator({
	variant,
	status,
	tone,
	hasIcon = false,
}: {
	variant: TimelineVariant;
	status: TimelineStatus;
	tone: TimelineTone;
	hasIcon?: boolean;
}): TimelineIndicator {
	const glyph = resolveGlyph(variant, status, hasIcon);
	if (tone !== "default") {
		const soft = TONE_SOFT[tone];
		return { fill: soft.fill, ring: soft.fill, foreground: soft.foreground, glyph };
	}
	if (status === "upcoming") return { fill: "background", ring: "border", foreground: "muted-foreground", glyph };
	return { fill: "primary", ring: "primary", foreground: "primary-foreground", glyph };
}

/**
 * Each horizontal column's start, from the columns' widths — the strip's
 * `snapToOffsets`, and the table {@link resolveColumnAtOffset} reads.
 */
export function resolveTimelineColumnOffsets(widths: readonly number[]): number[] {
	const offsets: number[] = [];
	let start = 0;
	for (const width of widths) {
		offsets.push(start);
		start += width;
	}
	return offsets;
}

/** How far short of a column's start a scroll may settle and still count as there. */
const READING_EDGE_SLOP = 1;

/**
 * Which column sits at the reading edge — the strip's left content inset — at a
 * scroll offset. The last column whose start the edge has reached, clamped to
 * the first; `-1` when there are no columns.
 *
 * Both the edge and every column start sit one inset in from the content's
 * origin, so the inset cancels and the raw `contentOffset.x` is the input. A
 * one-point slop absorbs a snap that settles a fraction short.
 *
 * A worklet: it runs inside the strip's scroll handler on every frame.
 */
export function resolveColumnAtOffset(offsets: readonly number[], x: number): number {
	"worklet";
	if (offsets.length === 0) return -1;
	let column = 0;
	for (let index = 1; index < offsets.length; index += 1) {
		const start = offsets[index];
		if (start === undefined || x + READING_EDGE_SLOP < start) break;
		column = index;
	}
	return column;
}

/**
 * A horizontal column's width. One with no content collapses to a tick whatever
 * it asked for — it marks a gap in time, not an event.
 */
export function resolveTimelineColumnWidth(width: number | undefined, hasContent: boolean): number {
	if (!hasContent) return TIMELINE_TICK_WIDTH;
	return width ?? TIMELINE_COLUMN_WIDTH;
}

/** A `Timeline.List`'s per-item width: one number for all, a function of the item, or the default. */
export type TimelineItemWidth<T> = number | ((item: T, index: number) => number);

/** Every column's width in a `Timeline.List`, in data order. */
export function resolveTimelineListWidths<T>(
	data: readonly T[],
	itemWidth: TimelineItemWidth<T> | undefined
): number[] {
	return data.map((item, index) => {
		if (itemWidth === undefined) return TIMELINE_COLUMN_WIDTH;
		if (typeof itemWidth === "number") return itemWidth;
		return itemWidth(item, index);
	});
}

/**
 * One column's layout for a horizontal list's `getItemLayout`, so a two-hundred
 * column strip is virtualised without measuring a cell. An index past the end
 * is a zero-width column at the end.
 */
export function resolveTimelineItemLayout(
	widths: readonly number[],
	offsets: readonly number[],
	index: number
): { length: number; offset: number; index: number } {
	const length = widths[index];
	const offset = offsets[index];
	if (length === undefined || offset === undefined) {
		const lastWidth = widths[widths.length - 1] ?? 0;
		const lastOffset = offsets[offsets.length - 1] ?? 0;
		return { index, length: 0, offset: lastOffset + lastWidth };
	}
	return { index, length, offset };
}

/** What a tone is read as. `destructive` is a token name, not a word anyone says. */
const TONE_WORD: Record<Exclude<TimelineTone, "default">, string> = {
	info: "info",
	success: "success",
	warning: "warning",
	destructive: "error",
};

/**
 * What VoiceOver and TalkBack read after an event's name: "Event 2 of 6,
 * completed, success". One-based. The default tone is not read, and an
 * uncounted timeline — its items behind a wrapper — claims no total.
 */
export function resolveTimelineAccessibilityValue({
	step,
	count,
	status,
	tone,
}: {
	step: number;
	count: number;
	status: TimelineStatus;
	tone: TimelineTone;
}): string {
	const position = count > 0 ? `Event ${step + 1} of ${count}` : `Event ${step + 1}`;
	const parts = [position, status];
	if (tone !== "default") parts.push(TONE_WORD[tone]);
	return parts.join(", ");
}
