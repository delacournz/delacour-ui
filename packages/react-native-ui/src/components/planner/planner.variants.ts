import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { PlannerCategory, PlannerEntry } from "./planner.types";
import { formatDayTitle, isSameMonth, toDayKey } from "./planner-dates";

/**
 * How a day draws its entries.
 *
 * `default` — the numeral, a dot per category and up to `entryLimit` icons.
 * `tiles` — one large icon, tinted by the first entry's colour, the date in the corner.
 * `calendar` — each entry's label in a coloured block; needs height, from `fill` or a `Scroller`.
 */
export const PLANNER_VARIANTS = ["default", "tiles", "calendar"] as const;

/** The five slots of the theme's series ramp, `--chart-1` … `--chart-5`. */
export const PLANNER_COLOR_INDEXES = [1, 2, 3, 4, 5] as const;

export type PlannerVariant = (typeof PLANNER_VARIANTS)[number];
export type PlannerColorIndex = (typeof PLANNER_COLOR_INDEXES)[number];

/** Icons a `default` day draws, or blocks a `calendar` day draws, before it says "+N". */
export const PLANNER_ENTRY_LIMITS: Record<PlannerVariant, number> = { default: 2, tiles: 2, calendar: 3 };

/** The duration of a month's slide, in ms. */
export const PLANNER_PAGE_DURATION = 220;

/**
 * Where the grid's swipe claims a drag and where it lets one go, in points.
 *
 * The same thresholds as the `Tabs` pager. At 20pt iOS's full-width back
 * swipe claimed a rightward drag first and popped the screen instead of
 * paging back a month.
 */
export const PLANNER_PAN = { activateX: 10, failY: 14 } as const;

/** A drag this fraction of the grid's width pages a month. */
export const PLANNER_SWIPE_DISTANCE = 0.25;

/** A flick this fast, in points per second, pages a month however short it was. */
export const PLANNER_SWIPE_VELOCITY = 500;

/**
 * Styling for every part of a planner.
 *
 * **Today rings, selection fills.** The day's `marker` carries a 2pt ring in
 * `primary` when it is today, and the `markerFill` inside it takes `bg-primary`
 * when it is selected — two marks for two questions, so a selected today shows
 * both rather than one hiding the other. The ring is always 2pt, transparent
 * when it is not today, so a day becoming today does not shift its numeral.
 *
 * **A week's height is fixed per variant** — `h-16` for `default`, a square
 * tile for `tiles`, a 96pt floor for `calendar` — and the grid is always six
 * weeks, so paging between a four-week February and a six-week month never
 * moves anything below the planner. `fill` trades the fixed heights for an
 * equal share of whatever height the planner is given.
 *
 * The chart tints are written out per slot, because Tailwind's scanner cannot
 * see a `bg-chart-${n}` built at runtime.
 *
 * View slots carry no `text-*` (rule 1). Free of React Native imports so it
 * stays unit-testable.
 */
export const plannerVariants = tv({
	slots: {
		root: "gap-3",
		header: "flex-row items-center gap-2",
		title: "flex-1 text-foreground",
		nav: "flex-row items-center gap-1",
		weekdays: "flex-row",
		weekday: "flex-1 text-center text-muted-foreground text-xs",
		grid: "overflow-hidden",
		week: "flex-row",
		cell: "flex-1 p-0.5",
		day: "flex-1 items-center gap-1 rounded-md pt-1",
		marker: "size-7 items-center justify-center rounded-full border-2 border-transparent",
		markerFill: "size-6 items-center justify-center rounded-full",
		numeral: "text-sm tabular-nums",
		dots: "h-1.5 flex-row items-center justify-center gap-0.5",
		dot: "size-1.5 rounded-full",
		icons: "flex-row items-center justify-center gap-0.5",
		overflow: "text-[10px] text-muted-foreground tabular-nums",
		tile: "flex-1 items-center justify-center rounded-lg border-2 border-transparent bg-muted",
		tileNumeral: "absolute top-1 left-1.5 text-[10px] tabular-nums",
		blocks: "w-full gap-0.5 px-0.5",
		block: "w-full rounded-sm px-1 py-0.5",
		blockLabel: "text-[10px] text-foreground leading-3",
		more: "px-1 text-[10px] text-muted-foreground",
		legend: "flex-row flex-wrap items-center gap-x-3 gap-y-1.5",
		legendItem: "flex-row items-center gap-1.5",
		legendDot: "size-2 rounded-full",
		legendLabel: "text-muted-foreground text-xs",
		legendCount: "text-foreground text-xs tabular-nums",
		summary: "w-full text-muted-foreground text-xs",
		footer: "flex-row flex-wrap items-center gap-2",
		swatch: "",
		tint: "",
	},
	variants: {
		variant: {
			default: { cell: "h-16" },
			tiles: { cell: "aspect-square" },
			calendar: {
				cell: "min-h-24 overflow-hidden",
				day: "items-start gap-0.5",
				marker: "ml-0.5 size-6",
				markerFill: "size-5",
			},
		},
		fill: {
			true: { root: "flex-1", grid: "flex-1", week: "flex-1", cell: "h-auto min-h-0" },
			false: {},
		},
		isToday: {
			true: { marker: "border-primary", tile: "border-primary" },
			false: {},
		},
		isSelected: {
			true: { markerFill: "bg-primary", numeral: "font-semibold", tile: "bg-primary" },
			false: {},
		},
		isInMonth: {
			true: { numeral: "text-foreground", tileNumeral: "text-muted-foreground" },
			false: { numeral: "text-muted-foreground", tileNumeral: "text-muted-foreground", day: "opacity-60" },
		},
		isFramed: {
			true: { header: "px-4", legend: "px-4", footer: "px-4", weekdays: "px-2", grid: "px-2" },
			false: {},
		},
		colorIndex: {
			1: { swatch: "bg-chart-1", tint: "bg-chart-1/15" },
			2: { swatch: "bg-chart-2", tint: "bg-chart-2/15" },
			3: { swatch: "bg-chart-3", tint: "bg-chart-3/15" },
			4: { swatch: "bg-chart-4", tint: "bg-chart-4/15" },
			5: { swatch: "bg-chart-5", tint: "bg-chart-5/15" },
		},
	},
	compoundVariants: [
		// After `isInMonth`, so a selected day reads on its fill whichever month it is in.
		{ isSelected: true, class: { numeral: "text-primary-foreground", tileNumeral: "text-primary-foreground" } },
		{ isSelected: true, isInMonth: false, class: { day: "opacity-100" } },
	],
	defaultVariants: {
		variant: "default",
		fill: false,
		isToday: false,
		isSelected: false,
		isInMonth: true,
		isFramed: false,
	},
});

export type PlannerVariantProps = VariantProps<typeof plannerVariants>;

/** The default entry limit for a variant, or the caller's, floored at one. */
export function resolveEntryLimit(variant: PlannerVariant, entryLimit?: number): number {
	if (entryLimit === undefined) return PLANNER_ENTRY_LIMITS[variant];
	return Math.max(1, Math.floor(entryLimit));
}

/** The entries keyed by the local calendar day they fall on, each day in the order given. */
export function groupEntriesByDay(entries: readonly PlannerEntry[]): Map<string, PlannerEntry[]> {
	const grouped = new Map<string, PlannerEntry[]>();
	for (const entry of entries) {
		const key = toDayKey(entry.date);
		const day = grouped.get(key);
		if (day) day.push(entry);
		else grouped.set(key, [entry]);
	}
	return grouped;
}

/**
 * What a day draws and how many it leaves to a "+N".
 *
 * A tile has room for one icon whatever the limit, so the rest of its entries
 * are the overflow. A `calendar` day's "+N more" is a line of its own, so when
 * there is overflow it takes the last of the limit's lines rather than adding
 * one — a day never draws more lines than the cell was sized for.
 */
export function resolveDayDisplay(
	entries: readonly PlannerEntry[],
	variant: PlannerVariant,
	entryLimit: number
): { shown: readonly PlannerEntry[]; overflow: number } {
	const limit = variant === "tiles" ? 1 : Math.max(1, entryLimit);
	const fits = entries.length <= limit;
	const shown = entries.slice(0, variant === "calendar" && !fits ? limit - 1 : limit);
	return { shown, overflow: entries.length - shown.length };
}

/** Where an entry's colour comes from. */
export type PlannerEntryColor =
	| { kind: "chart"; index: PlannerColorIndex }
	| { kind: "literal"; color: string }
	| { kind: "default" };

/**
 * An entry's colour: its own `color`, else its category's `color`, else its
 * category's chart slot, else the default — `primary`.
 */
export function resolveEntryColor(
	entry: PlannerEntry,
	categories: readonly PlannerCategory[] | undefined
): PlannerEntryColor {
	if (entry.color) return { kind: "literal", color: entry.color };
	const category = entry.category === undefined ? undefined : categories?.find((c) => c.id === entry.category);
	return resolveCategoryColor(category);
}

/** A category's colour, the same way {@link resolveEntryColor} reads it. */
export function resolveCategoryColor(category: PlannerCategory | undefined): PlannerEntryColor {
	if (category?.color) return { kind: "literal", color: category.color };
	if (category?.colorIndex) return { kind: "chart", index: category.colorIndex };
	return { kind: "default" };
}

/** The token or literal an `Icon`'s `color` takes for a resolved colour. */
export function entryColorToken(color: PlannerEntryColor): string {
	switch (color.kind) {
		case "chart":
			return `chart-${color.index}`;
		case "literal":
			return color.color;
		case "default":
			return "primary";
	}
}

export type PlannerCategoryCount = { category: PlannerCategory; count: number };

/**
 * The displayed month's entries counted per category, in the categories'
 * order with zeros kept — a legend row does not vanish in a quiet month —
 * plus the entries no known category claims and the month's total.
 */
export function countByCategory(
	entries: readonly PlannerEntry[],
	month: Date,
	categories: readonly PlannerCategory[] = []
): { items: PlannerCategoryCount[]; uncategorized: number; total: number } {
	const counts = new Map<string, number>(categories.map((category) => [category.id, 0]));
	let uncategorized = 0;
	let total = 0;

	for (const entry of entries) {
		const key = toDayKey(entry.date);
		const [year, monthNumber] = key.split("-").map(Number);
		if (year !== month.getFullYear() || monthNumber !== month.getMonth() + 1) continue;
		total += 1;
		const current = entry.category === undefined ? undefined : counts.get(entry.category);
		if (current === undefined || entry.category === undefined) uncategorized += 1;
		else counts.set(entry.category, current + 1);
	}

	return {
		items: categories.map((category) => ({ category, count: counts.get(category.id) ?? 0 })),
		uncategorized,
		total,
	};
}

/**
 * A day's spoken label: "Wednesday, 14 October, 3 entries, Run, Strength, today".
 *
 * Each category is said once, in the order its first entry appears; an entry
 * with no known category is named by its own label. Selection is not in the
 * label — it is the button's `selected` state, which the screen reader speaks
 * in its own words.
 */
export function resolvePlannerDayLabel({
	date,
	entries,
	categories,
	isToday,
	locale,
}: {
	date: Date;
	entries: readonly PlannerEntry[];
	categories: readonly PlannerCategory[] | undefined;
	isToday: boolean;
	locale: string | undefined;
}): string {
	const parts = [formatDayTitle(date, locale), resolveEntryCount(entries.length)];

	const names: string[] = [];
	for (const entry of entries) {
		const category = entry.category === undefined ? undefined : categories?.find((c) => c.id === entry.category);
		const name = category?.label ?? entry.label;
		if (!names.includes(name)) names.push(name);
	}
	parts.push(...names);

	if (isToday) parts.push("today");
	return parts.join(", ");
}

/** "no entries", "1 entry", "3 entries". */
export function resolveEntryCount(count: number): string {
	if (count === 0) return "no entries";
	return count === 1 ? "1 entry" : `${count} entries`;
}

/**
 * Which way a released swipe pages: `1` for the next month, `-1` for the
 * previous, `0` to settle back.
 *
 * A drag a quarter of the width across pages; so does a flick, however short,
 * unless the finger flicked back the way it came.
 */
export function resolveSwipePage(translationX: number, velocityX: number, width: number): -1 | 0 | 1 {
	if (width <= 0) return 0;
	const far = Math.abs(translationX) >= width * PLANNER_SWIPE_DISTANCE;
	const fast = Math.abs(velocityX) >= PLANNER_SWIPE_VELOCITY;
	const reversing = translationX !== 0 && velocityX !== 0 && Math.sign(translationX) !== Math.sign(velocityX);

	if (fast && !reversing) return velocityX < 0 ? 1 : -1;
	if (far && !(fast && reversing)) return translationX < 0 ? 1 : -1;
	return 0;
}

/** Whether the "Today" control has nowhere to go — the displayed month is the current one. */
export function isCurrentMonth(month: Date, today: Date): boolean {
	return isSameMonth(month, today);
}
