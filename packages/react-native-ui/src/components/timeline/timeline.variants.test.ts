import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	isTimelineRailComplete,
	resolveColumnAtOffset,
	resolveTimelineAccessibilityValue,
	resolveTimelineColumnOffsets,
	resolveTimelineColumnWidth,
	resolveTimelineIndicator,
	resolveTimelineItemLayout,
	resolveTimelineListWidths,
	resolveTimelineStatus,
	TIMELINE_COLUMN_WIDTH,
	TIMELINE_DEFAULT_ORIENTATION,
	TIMELINE_DEFAULT_SIZE,
	TIMELINE_DEFAULT_VARIANT,
	TIMELINE_DESCRIPTION_TEXT_SIZE,
	TIMELINE_ORIENTATIONS,
	TIMELINE_SIZES,
	TIMELINE_STATUSES,
	TIMELINE_TICK_WIDTH,
	TIMELINE_TITLE_TEXT_SIZE,
	TIMELINE_TONES,
	TIMELINE_VARIANTS,
	type TimelineStatus,
	type TimelineTone,
	type TimelineVariant,
	timelineVariants,
} from "./timeline.variants";

/** Tailwind's own spacing scale, in points. `size-8` is thirty-two. */
const SPACING_STEP_PX = 4;

/** Tailwind v4's default line heights, in points, per `Text` size step. */
const LINE_HEIGHT_PX: Record<string, number> = { xs: 16, sm: 20, md: 24 };

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** Whether a class string carries one exact utility. */
function has(value: string | undefined, utility: string): boolean {
	return cls(value).split(/\s+/).includes(utility);
}

/** The step a `prefix-N` class sets — `size-8` with `size` yields 8. */
function step(value: string | undefined, prefix: string): number {
	const found = cls(value).match(new RegExp(`(?:^|\\s)${prefix}-(\\d+(?:\\.\\d+)?)(?:\\s|$)`))?.[1];
	if (found === undefined) throw new Error(`no ${prefix}-* in "${value}"`);
	return Number(found);
}

/** Every combination that paints an indicator. */
function everyCell(): { variant: TimelineVariant; status: TimelineStatus; tone: TimelineTone }[] {
	const cells = [];
	for (const variant of TIMELINE_VARIANTS) {
		for (const status of TIMELINE_STATUSES) {
			for (const tone of TIMELINE_TONES) {
				cells.push({ variant, status, tone });
			}
		}
	}
	return cells;
}

const DOT_VARIANTS = ["dot", "card", "compact"] as const;
const CIRCLE_VARIANTS = ["icon", "numbered"] as const;

describe("constants", () => {
	test("the axes are the ones the docs name", () => {
		expect(TIMELINE_TONES).toEqual(["default", "info", "success", "warning", "destructive"]);
		expect(TIMELINE_VARIANTS).toEqual(["dot", "icon", "numbered", "card", "compact"]);
		expect(TIMELINE_SIZES).toEqual(["sm", "md"]);
		expect(TIMELINE_ORIENTATIONS).toEqual(["vertical", "horizontal"]);
		expect(TIMELINE_STATUSES).toEqual(["completed", "current", "upcoming"]);
	});

	test("the named defaults match tv's defaultVariants", () => {
		const fromDefaults = timelineVariants();
		const named = timelineVariants({
			orientation: TIMELINE_DEFAULT_ORIENTATION,
			size: TIMELINE_DEFAULT_SIZE,
			variant: TIMELINE_DEFAULT_VARIANT,
		});
		for (const slot of ["root", "item", "track", "indicator", "content", "title"] as const) {
			expect(cls(fromDefaults[slot]())).toBe(cls(named[slot]()));
		}
	});

	test("an empty column collapses to a tick narrower than any real column", () => {
		expect(TIMELINE_TICK_WIDTH).toBe(24);
		expect(TIMELINE_COLUMN_WIDTH).toBeGreaterThan(TIMELINE_TICK_WIDTH);
	});

	test("the description is one text step below the title", () => {
		expect(TIMELINE_TITLE_TEXT_SIZE).toEqual({ sm: "sm", md: "md" });
		expect(TIMELINE_DESCRIPTION_TEXT_SIZE).toEqual({ sm: "xs", md: "sm" });
	});
});

describe("resolveTimelineStatus", () => {
	test("before the value is completed, at it current, after it upcoming", () => {
		expect(resolveTimelineStatus({ step: 0, value: 2 })).toBe("completed");
		expect(resolveTimelineStatus({ step: 2, value: 2 })).toBe("current");
		expect(resolveTimelineStatus({ step: 3, value: 2 })).toBe("upcoming");
	});

	test("the default value of -1 leaves every event upcoming", () => {
		for (const s of [0, 1, 5]) expect(resolveTimelineStatus({ step: s, value: -1 })).toBe("upcoming");
	});

	test("isCompleted true wins everywhere", () => {
		expect(resolveTimelineStatus({ step: 5, value: 2, isCompleted: true })).toBe("completed");
		expect(resolveTimelineStatus({ step: 2, value: 2, isCompleted: true })).toBe("completed");
	});

	test("isCompleted false un-completes a passed event but never demotes the current one", () => {
		expect(resolveTimelineStatus({ step: 0, value: 2, isCompleted: false })).toBe("upcoming");
		expect(resolveTimelineStatus({ step: 2, value: 2, isCompleted: false })).toBe("current");
	});
});

describe("isTimelineRailComplete", () => {
	test("the segment leaving an event fills once the value has passed it", () => {
		expect(isTimelineRailComplete(0, 2)).toBe(true);
		expect(isTimelineRailComplete(1, 2)).toBe(true);
		expect(isTimelineRailComplete(2, 2)).toBe(false);
		expect(isTimelineRailComplete(0, -1)).toBe(false);
	});

	test("the rail is never half filled: filled segments are a prefix of the sequence", () => {
		for (let value = -1; value < 8; value += 1) {
			const filled = Array.from({ length: 7 }, (_, s) => isTimelineRailComplete(s, value));
			const firstEmpty = filled.indexOf(false);
			if (firstEmpty !== -1) expect(filled.slice(firstEmpty).every((f) => !f)).toBe(true);
		}
	});
});

describe("resolveTimelineIndicator", () => {
	test("progress is solid: a reached default event fills primary", () => {
		for (const status of ["completed", "current"] as const) {
			expect(resolveTimelineIndicator({ variant: "dot", status, tone: "default" })).toMatchObject({
				fill: "primary",
				foreground: "primary-foreground",
			});
		}
	});

	test("an upcoming default event is a muted ring", () => {
		expect(resolveTimelineIndicator({ variant: "dot", status: "upcoming", tone: "default" })).toMatchObject({
			fill: "background",
			ring: "border",
			foreground: "muted-foreground",
		});
	});

	test("kind is tinted: a toned event is its soft pair whatever its progress", () => {
		for (const tone of TIMELINE_TONES.filter((t) => t !== "default")) {
			for (const status of TIMELINE_STATUSES) {
				expect(resolveTimelineIndicator({ variant: "numbered", status, tone })).toMatchObject({
					fill: `${tone}-soft`,
					foreground: `${tone}-soft-foreground`,
				});
			}
		}
	});

	test("the glyph follows the variant", () => {
		const glyph = (variant: TimelineVariant, status: TimelineStatus = "upcoming", hasIcon = false) =>
			resolveTimelineIndicator({ hasIcon, status, tone: "default", variant }).glyph;
		expect(glyph("dot")).toBe("dot");
		expect(glyph("card")).toBe("dot");
		expect(glyph("compact")).toBe("dot");
		expect(glyph("numbered")).toBe("number");
		expect(glyph("numbered", "completed")).toBe("number");
		expect(glyph("icon", "upcoming", true)).toBe("icon");
		expect(glyph("icon", "completed", false)).toBe("check");
		expect(glyph("icon", "upcoming", false)).toBe("dot");
	});

	test("every token it names is declared by both themes", () => {
		const light = declaredTokens("light");
		const dark = declaredTokens("dark");
		for (const cell of everyCell()) {
			const { fill, ring, foreground } = resolveTimelineIndicator(cell);
			for (const token of [fill, ring, foreground]) {
				expect(light.has(token)).toBe(true);
				expect(dark.has(token)).toBe(true);
			}
		}
	});

	test("the indicator slot paints exactly the tokens the resolver names", () => {
		for (const cell of everyCell()) {
			const { fill, ring, foreground } = resolveTimelineIndicator(cell);
			const slots = timelineVariants({ status: cell.status, tone: cell.tone, variant: cell.variant });
			expect(has(slots.indicator(), `bg-${fill}`)).toBe(true);
			expect(has(slots.indicator(), `border-${ring}`)).toBe(true);
			expect(has(slots.indicatorLabel(), `text-${foreground}`)).toBe(true);
		}
	});
});

describe("columns", () => {
	test("offsets are cumulative starts", () => {
		expect(resolveTimelineColumnOffsets([160, 24, 160, 160])).toEqual([0, 160, 184, 344]);
		expect(resolveTimelineColumnOffsets([])).toEqual([]);
	});

	test("the column at the reading edge is the last one started", () => {
		const offsets = [0, 160, 184, 344];
		expect(resolveColumnAtOffset(offsets, -40)).toBe(0);
		expect(resolveColumnAtOffset(offsets, 0)).toBe(0);
		expect(resolveColumnAtOffset(offsets, 120)).toBe(0);
		expect(resolveColumnAtOffset(offsets, 170)).toBe(1);
		expect(resolveColumnAtOffset(offsets, 184)).toBe(2);
		expect(resolveColumnAtOffset(offsets, 9999)).toBe(3);
	});

	test("a snap that lands a fraction short still counts as that column", () => {
		expect(resolveColumnAtOffset([0, 160], 159.6)).toBe(1);
	});

	test("no columns is no column", () => {
		expect(resolveColumnAtOffset([], 10)).toBe(-1);
	});

	test("a column with no content collapses to the tick, whatever it asked for", () => {
		expect(resolveTimelineColumnWidth(undefined, true)).toBe(TIMELINE_COLUMN_WIDTH);
		expect(resolveTimelineColumnWidth(200, true)).toBe(200);
		expect(resolveTimelineColumnWidth(200, false)).toBe(TIMELINE_TICK_WIDTH);
		expect(resolveTimelineColumnWidth(undefined, false)).toBe(TIMELINE_TICK_WIDTH);
	});

	test("list widths read a number, a function or nothing", () => {
		const data = [{ empty: false }, { empty: true }, { empty: false }];
		expect(resolveTimelineListWidths(data, undefined)).toEqual([160, 160, 160]);
		expect(resolveTimelineListWidths(data, 120)).toEqual([120, 120, 120]);
		expect(resolveTimelineListWidths(data, (item) => (item.empty ? 24 : 180))).toEqual([180, 24, 180]);
	});

	test("an item layout is its width at its offset, for getItemLayout", () => {
		const widths = [160, 24, 160];
		const offsets = resolveTimelineColumnOffsets(widths);
		expect(resolveTimelineItemLayout(widths, offsets, 2)).toEqual({ index: 2, length: 160, offset: 184 });
		expect(resolveTimelineItemLayout(widths, offsets, 9)).toEqual({ index: 9, length: 0, offset: 344 });
	});
});

describe("resolveTimelineAccessibilityValue", () => {
	test("position, then status, then tone", () => {
		expect(resolveTimelineAccessibilityValue({ count: 6, status: "completed", step: 1, tone: "success" })).toBe(
			"Event 2 of 6, completed, success"
		);
	});

	test("the default tone is not read", () => {
		expect(resolveTimelineAccessibilityValue({ count: 3, status: "current", step: 0, tone: "default" })).toBe(
			"Event 1 of 3, current"
		);
	});

	test("an uncounted timeline does not claim a total", () => {
		expect(resolveTimelineAccessibilityValue({ count: 0, status: "upcoming", step: 4, tone: "warning" })).toBe(
			"Event 5, upcoming, warning"
		);
	});

	test("destructive is read as an error, not a token name", () => {
		expect(resolveTimelineAccessibilityValue({ count: 2, status: "current", step: 1, tone: "destructive" })).toBe(
			"Event 2 of 2, current, error"
		);
	});
});

describe("slots", () => {
	test("dot variants draw a small dot, icon and numbered a circle that holds a glyph", () => {
		for (const size of TIMELINE_SIZES) {
			for (const variant of DOT_VARIANTS) {
				expect(step(timelineVariants({ size, variant }).indicator(), "size")).toBeLessThanOrEqual(3);
			}
			for (const variant of CIRCLE_VARIANTS) {
				expect(step(timelineVariants({ size, variant }).indicator(), "size")).toBeGreaterThanOrEqual(6);
			}
		}
	});

	test("a vertical track is exactly as wide as the box that centres its indicator", () => {
		for (const size of TIMELINE_SIZES) {
			for (const variant of TIMELINE_VARIANTS) {
				const slots = timelineVariants({ orientation: "vertical", size, variant });
				expect(step(slots.track(), "w")).toBe(step(slots.indicatorBox(), "size"));
			}
		}
	});

	test("a dot's box is one title line tall, so the dot sits level with the title's first line", () => {
		for (const size of TIMELINE_SIZES) {
			for (const variant of DOT_VARIANTS) {
				const box = step(timelineVariants({ size, variant }).indicatorBox(), "size") * SPACING_STEP_PX;
				expect(box).toBe(LINE_HEIGHT_PX[TIMELINE_TITLE_TEXT_SIZE[size]] ?? Number.NaN);
			}
		}
	});

	test("a circle's title is padded down by half the difference between circle and line", () => {
		for (const size of TIMELINE_SIZES) {
			for (const variant of CIRCLE_VARIANTS) {
				const slots = timelineVariants({ orientation: "vertical", size, variant });
				const circle = step(slots.indicatorBox(), "size") * SPACING_STEP_PX;
				const line = LINE_HEIGHT_PX[TIMELINE_TITLE_TEXT_SIZE[size]] ?? Number.NaN;
				expect(step(slots.content(), "pt") * SPACING_STEP_PX).toBe((circle - line) / 2);
			}
		}
	});

	test("compact halves the gap between vertical events", () => {
		for (const size of TIMELINE_SIZES) {
			const dot = step(timelineVariants({ orientation: "vertical", size, variant: "dot" }).content(), "pb");
			const compact = step(timelineVariants({ orientation: "vertical", size, variant: "compact" }).content(), "pb");
			expect(compact * 2).toBe(dot);
		}
	});

	test("the last vertical event leaves no gap below it", () => {
		for (const variant of TIMELINE_VARIANTS) {
			expect(has(timelineVariants({ isLast: true, orientation: "vertical", variant }).content(), "pb-0")).toBe(true);
		}
	});

	test("a filled rail is primary, an empty one the border colour", () => {
		expect(has(timelineVariants({ isRailComplete: true }).rail(), "bg-primary")).toBe(true);
		expect(has(timelineVariants({ isRailComplete: false }).rail(), "bg-border")).toBe(true);
	});

	test("a vertical rail runs down, a horizontal one across", () => {
		expect(has(timelineVariants({ orientation: "vertical" }).rail(), "w-0.5")).toBe(true);
		expect(has(timelineVariants({ orientation: "horizontal" }).rail(), "h-0.5")).toBe(true);
	});

	test("a horizontal item stacks its content band above its track", () => {
		const slots = timelineVariants({ orientation: "horizontal" });
		expect(has(slots.item(), "flex-col")).toBe(true);
		expect(has(slots.track(), "flex-row")).toBe(true);
		expect(has(slots.content(), "justify-end")).toBe(true);
	});

	test("upcoming vertical titles are muted; reached ones are not", () => {
		expect(has(timelineVariants({ status: "upcoming" }).title(), "text-muted-foreground")).toBe(true);
		expect(has(timelineVariants({ status: "current" }).title(), "text-foreground")).toBe(true);
		expect(has(timelineVariants({ status: "completed" }).title(), "text-foreground")).toBe(true);
	});

	test("a horizontal title carries no colour class — the reading edge animates it", () => {
		for (const status of TIMELINE_STATUSES) {
			expect(cls(timelineVariants({ orientation: "horizontal", status }).title())).not.toMatch(
				/\btext-(muted-)?foreground\b/
			);
		}
	});

	test("a card event's dot is padded down by the card's own inset", () => {
		for (const size of TIMELINE_SIZES) {
			expect(has(timelineVariants({ orientation: "vertical", size, variant: "card" }).track(), "pt-3")).toBe(true);
		}
	});
});
