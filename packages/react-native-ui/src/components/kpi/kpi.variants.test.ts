import { describe, expect, test } from "bun:test";
import { CARD_PLANES, CARD_SIZES, cardVariants } from "../card/card.variants";
import {
	formatKpiTrend,
	KPI_COLOR_INDEXES,
	KPI_GOOD_DIRECTIONS,
	KPI_GROUP_ORIENTATIONS,
	KPI_LAYOUTS,
	KPI_SIZES,
	KPI_TONE_BADGE_COLOR,
	KPI_TONES,
	KPI_TREND_VARIANTS,
	kpiSparklineAccessibilityLabel,
	kpiTrendAccessibilityLabel,
	kpiVariants,
	resolveKpiTrend,
	resolveSparklineDomain,
	resolveSparklineFilled,
	resolveSparklineSeries,
} from "./kpi.variants";

/** Every slot the variant function can produce, one call per combination. */
function everyCombination(): ReturnType<typeof kpiVariants>[] {
	return KPI_SIZES.flatMap((size) =>
		KPI_LAYOUTS.flatMap((layout) =>
			KPI_TONES.flatMap((tone) =>
				KPI_COLOR_INDEXES.flatMap((colorIndex) =>
					CARD_PLANES.map((plane) => kpiVariants({ colorIndex, layout, plane, size, tone }))
				)
			)
		)
	);
}

/** The numeric step of the first `${prefix}-N` utility in a class string. */
function step(cls: string, prefix: string): string | undefined {
	return cls.match(new RegExp(`(?:^|\\s)${prefix}-(\\d+(?:\\.5)?)(?:\\s|$)`))?.[1];
}

describe("resolveKpiTrend", () => {
	test("a rise is good news by default", () => {
		expect(resolveKpiTrend({ value: 7.8 })).toEqual({ direction: "up", tone: "good" });
	});

	test("a fall is bad news by default", () => {
		expect(resolveKpiTrend({ value: -4.2 })).toEqual({ direction: "down", tone: "bad" });
	});

	// Churn, refunds, latency: the number going down is the good news, and the
	// colour has to say so rather than follow the sign.
	test("goodDirection down turns a fall into good news and a rise into bad", () => {
		expect(resolveKpiTrend({ goodDirection: "down", value: -8.4 })).toEqual({ direction: "down", tone: "good" });
		expect(resolveKpiTrend({ goodDirection: "down", value: 3 })).toEqual({ direction: "up", tone: "bad" });
	});

	test("goodDirection none keeps the direction and drops the judgement", () => {
		expect(resolveKpiTrend({ goodDirection: "none", value: 2.2 })).toEqual({ direction: "up", tone: "neutral" });
		expect(resolveKpiTrend({ goodDirection: "none", value: -2.2 })).toEqual({ direction: "down", tone: "neutral" });
	});

	test("zero is flat and neutral whichever way is good", () => {
		for (const goodDirection of KPI_GOOD_DIRECTIONS) {
			expect(resolveKpiTrend({ goodDirection, value: 0 })).toEqual({ direction: "flat", tone: "neutral" });
		}
	});

	test("a movement inside the threshold counts as no movement", () => {
		expect(resolveKpiTrend({ threshold: 0.5, value: 0.4 })).toEqual({ direction: "flat", tone: "neutral" });
		expect(resolveKpiTrend({ threshold: 0.5, value: -0.5 })).toEqual({ direction: "flat", tone: "neutral" });
		expect(resolveKpiTrend({ threshold: 0.5, value: 0.6 })).toEqual({ direction: "up", tone: "good" });
	});

	// A value the caller could not compute — a division by a zero baseline —
	// must not be painted as good or bad news.
	test("a non-finite value is flat and neutral", () => {
		expect(resolveKpiTrend({ value: Number.NaN })).toEqual({ direction: "flat", tone: "neutral" });
		expect(resolveKpiTrend({ value: Number.POSITIVE_INFINITY })).toEqual({ direction: "flat", tone: "neutral" });
	});

	test("a negative threshold is treated as zero", () => {
		expect(resolveKpiTrend({ threshold: -1, value: 0.1 })).toEqual({ direction: "up", tone: "good" });
	});
});

describe("formatKpiTrend", () => {
	test("prints one decimal place with an explicit sign", () => {
		expect(formatKpiTrend(7.8)).toBe("+7.8%");
		expect(formatKpiTrend(12)).toBe("+12.0%");
	});

	// A hyphen-minus is narrower than a plus, so a column of changes would not
	// line up on the sign. The typographic minus is the width of the plus.
	test("uses the minus sign, not a hyphen, for a fall", () => {
		expect(formatKpiTrend(-4.25)).toBe("−4.3%");
		expect(formatKpiTrend(-4.25)).not.toContain("-");
	});

	test("prints zero unsigned", () => {
		expect(formatKpiTrend(0)).toBe("0.0%");
		expect(formatKpiTrend(-0)).toBe("0.0%");
	});

	// -0.04 rounds to zero at one place; "−0.0%" would claim a fall nothing shows.
	test("prints a value that rounds to zero unsigned", () => {
		expect(formatKpiTrend(-0.04)).toBe("0.0%");
	});

	test("prints a dash for a non-finite value", () => {
		expect(formatKpiTrend(Number.NaN)).toBe("—");
	});
});

describe("kpiTrendAccessibilityLabel", () => {
	test("announces the direction and the size in words, then the caption", () => {
		expect(kpiTrendAccessibilityLabel({ caption: "vs last month", direction: "up", value: 7.8 })).toBe(
			"Up 7.8 percent, vs last month"
		);
		expect(kpiTrendAccessibilityLabel({ direction: "down", value: -4.2 })).toBe("Down 4.2 percent");
	});

	test("announces a flat change as no change", () => {
		expect(kpiTrendAccessibilityLabel({ direction: "flat", value: 0 })).toBe("No change");
		expect(kpiTrendAccessibilityLabel({ caption: "vs last week", direction: "flat", value: 0.1 })).toBe(
			"No change, vs last week"
		);
	});

	// A caller's own format may not be a percentage at all ("+120 users"), so
	// it is read as written after the direction rather than rewritten.
	test("reads a caller's own formatted text after the direction", () => {
		expect(kpiTrendAccessibilityLabel({ direction: "up", formatted: "+120 users", value: 120 })).toBe("Up, +120 users");
	});
});

describe("KPI_TONE_BADGE_COLOR", () => {
	test("maps good news to success, bad news to destructive and neutral to default", () => {
		expect(KPI_TONE_BADGE_COLOR).toEqual({ bad: "destructive", good: "success", neutral: "default" });
	});
});

describe("resolveSparklineSeries", () => {
	test("indexes a bare list of numbers", () => {
		const series = resolveSparklineSeries({ data: [3, 5, 4] });
		expect(series.xKey).toBe("index");
		expect(series.yKey).toBe("value");
		expect(series.rows).toEqual([
			{ index: 0, value: 3 },
			{ index: 1, value: 5 },
			{ index: 2, value: 4 },
		]);
		expect(series.values).toEqual([3, 5, 4]);
	});

	test("passes rows through with the caller's keys", () => {
		const rows = [
			{ day: "Mon", visits: 10 },
			{ day: "Tue", visits: 14 },
		];
		const series = resolveSparklineSeries({ data: rows, xKey: "day", yKey: "visits" });
		expect(series.rows).toBe(rows);
		expect(series.xKey).toBe("day");
		expect(series.yKey).toBe("visits");
		expect(series.values).toEqual([10, 14]);
	});

	test("reads a missing or non-numeric row value as NaN", () => {
		const series = resolveSparklineSeries({
			data: [{ at: 1, v: 2 }, { at: 2 }, { at: 3, v: "x" }],
			xKey: "at",
			yKey: "v",
		});
		expect(series.values[0]).toBe(2);
		expect(series.values[1]).toBeNaN();
		expect(series.values[2]).toBeNaN();
	});
});

describe("resolveSparklineDomain", () => {
	// With no axis and no padding, a line through the data's own extent draws
	// its peak and its trough on the frame's edge, half a stroke off the canvas.
	test("pads the data's extent by a fraction of its span at each end", () => {
		expect(resolveSparklineDomain([10, 20])).toEqual([9, 21]);
	});

	test("ignores values that are not finite", () => {
		expect(resolveSparklineDomain([Number.NaN, 10, 20, Number.POSITIVE_INFINITY])).toEqual([9, 21]);
	});

	// A flat series has no span to take a fraction of; the line sits centred.
	test("centres a flat series in a unit either side", () => {
		expect(resolveSparklineDomain([5, 5, 5])).toEqual([4, 6]);
	});

	test("returns undefined when there is nothing to plot", () => {
		expect(resolveSparklineDomain([])).toBeUndefined();
		expect(resolveSparklineDomain([Number.NaN])).toBeUndefined();
	});
});

describe("resolveSparklineFilled", () => {
	test("fills under the full-width chart and not beside the number", () => {
		expect(resolveSparklineFilled({ layout: "below" })).toBe(true);
		expect(resolveSparklineFilled({ layout: "inline" })).toBe(false);
	});

	test("an explicit choice wins either way", () => {
		expect(resolveSparklineFilled({ filled: false, layout: "below" })).toBe(false);
		expect(resolveSparklineFilled({ filled: true, layout: "inline" })).toBe(true);
	});
});

describe("kpiSparklineAccessibilityLabel", () => {
	test("names the span and the first and last point", () => {
		expect(kpiSparklineAccessibilityLabel([120, 150, 184])).toBe("Trend over 3 points, from 120 to 184");
	});

	test("reads the ends through a caller's formatter", () => {
		expect(kpiSparklineAccessibilityLabel([1200, 1840], (value) => `$${value}`)).toBe(
			"Trend over 2 points, from $1200 to $1840"
		);
	});

	test("skips gaps when finding the ends", () => {
		expect(kpiSparklineAccessibilityLabel([Number.NaN, 4, 6, Number.NaN])).toBe("Trend over 4 points, from 4 to 6");
	});

	test("says there is no data when there is none", () => {
		expect(kpiSparklineAccessibilityLabel([])).toBe("No trend data");
	});
});

describe("kpiVariants insets", () => {
	// A KPI is a card, and its header and content have to sit on the card's own
	// inset or the number drifts off the footer beneath it.
	test("the header and content carry no inset of their own — the card's parts supply it", () => {
		for (const slots of everyCombination()) {
			expect(slots.header()).not.toMatch(/(^|\s)(p|px|pl|pr)-/);
			expect(slots.content()).not.toMatch(/(^|\s)(p|px|pl|pr)-/);
		}
	});

	test("composes onto the card's header and content without losing the card's inset", () => {
		for (const size of CARD_SIZES) {
			const card = cardVariants({ size });
			const kpi = kpiVariants({ size });
			const header = card.header({ className: kpi.header() });
			const content = card.content({ className: kpi.content() });
			expect(step(header, "px")).toBe(step(card.header(), "px"));
			expect(step(content, "px")).toBe(step(card.content(), "px"));
			expect(header).toContain("items-center");
			expect(header).not.toContain("items-start");
		}
	});
});

describe("kpiVariants value", () => {
	test("steps the value's scale with the size", () => {
		expect(kpiVariants({ size: "sm" }).value()).toContain("text-2xl");
		expect(kpiVariants({ size: "md" }).value()).toContain("text-3xl");
		expect(kpiVariants({ size: "lg" }).value()).toContain("text-4xl");
	});

	test("the value is the X-foreground token of the plane it sits on", () => {
		expect(kpiVariants({ plane: "default" }).value()).toContain("text-card-foreground");
		expect(kpiVariants({ plane: "secondary" }).value()).toContain("text-secondary-foreground");
		expect(kpiVariants({ plane: "tertiary" }).value()).toContain("text-tertiary-foreground");
		expect(kpiVariants({ plane: "none" }).value()).toContain("text-foreground");
	});

	test("the value carries exactly one text colour", () => {
		for (const slots of everyCombination()) {
			const colours = slots
				.value()
				.split(/\s+/)
				.filter((name) => /^text-(card|secondary|tertiary|foreground|muted)/.test(name));
			expect(colours).toHaveLength(1);
		}
	});

	// The loading placeholder stands where the number will be, so it has to be
	// the number's height or the card jumps when the data lands.
	test("the value placeholder is as tall as the value's line at every size", () => {
		const lineHeight: Record<string, string> = { "text-2xl": "8", "text-3xl": "9", "text-4xl": "10" };
		for (const size of KPI_SIZES) {
			const slots = kpiVariants({ size });
			const scale = slots.value().match(/text-(2xl|3xl|4xl)/)?.[0] ?? "";
			expect(step(slots.valuePlaceholder(), "h")).toBe(lineHeight[scale]);
		}
	});
});

describe("kpiVariants placeholders", () => {
	// `bg-muted` is the secondary fill in both themes, so a placeholder painted
	// with it vanished on a secondary card. A translucent foreground reads on
	// every plane the card can land on.
	test("every placeholder is a translucent foreground, never a fill token", () => {
		for (const slots of everyCombination()) {
			for (const cls of [slots.valuePlaceholder(), slots.trendPlaceholder(), slots.sparklinePlaceholder()]) {
				expect(cls).toContain("bg-muted-foreground/15");
				expect(cls).not.toMatch(/(^|\s)bg-(muted|secondary|tertiary|card)(\s|$)/);
			}
		}
	});
});

describe("kpiVariants title", () => {
	test("the title is quiet on every plane — the value is the thing being read", () => {
		for (const slots of everyCombination()) {
			expect(slots.title()).toContain("text-muted-foreground");
		}
	});

	// A growing child of a column absorbs the column's spare height, which lands
	// the numbers of a row of cards at different heights. The title never grows.
	test("the title never grows", () => {
		for (const slots of everyCombination()) {
			expect(slots.title()).not.toMatch(/(^|\s)(flex-1|grow)(\s|$)/);
		}
	});

	test("the header's trailing action is pushed to the end rather than the title stretched to reach it", () => {
		expect(kpiVariants().action()).toContain("ml-auto");
	});
});

describe("kpiVariants trend", () => {
	test("colours the text by tone, never by sign", () => {
		expect(kpiVariants({ tone: "good" }).trendText()).toContain("text-success-soft-foreground");
		expect(kpiVariants({ tone: "bad" }).trendText()).toContain("text-destructive-soft-foreground");
		expect(kpiVariants({ tone: "neutral" }).trendText()).toContain("text-muted-foreground");
	});

	test("the caption is muted at every tone", () => {
		for (const tone of KPI_TONES) {
			expect(kpiVariants({ tone }).trendCaption()).toContain("text-muted-foreground");
		}
	});

	test("every trend variant is covered by a badge colour or a text tone", () => {
		expect(KPI_TREND_VARIANTS).toEqual(["text", "badge"]);
	});
});

describe("kpiVariants icon", () => {
	test("tints the icon square from the series ramp, one token per colour index", () => {
		for (const colorIndex of KPI_COLOR_INDEXES) {
			expect(kpiVariants({ colorIndex }).icon()).toContain(`bg-chart-${colorIndex}/15`);
		}
	});

	test("the glyph is a step on the icon scale, growing with the square", () => {
		expect(kpiVariants({ size: "sm" }).iconGlyph()).toBe("size-icon-xs");
		expect(kpiVariants({ size: "md" }).iconGlyph()).toBe("size-icon-sm");
		expect(kpiVariants({ size: "lg" }).iconGlyph()).toBe("size-icon-lg");
	});

	test("steps the square with the size", () => {
		const sizes = new Set(KPI_SIZES.map((size) => kpiVariants({ size }).icon()));
		expect(sizes.size).toBe(KPI_SIZES.length);
	});
});

describe("kpiVariants layout", () => {
	test("below stacks the stat over the chart; inline sets them in a row", () => {
		expect(kpiVariants({ layout: "below" }).content()).not.toContain("flex-row");
		expect(kpiVariants({ layout: "inline" }).content()).toContain("flex-row");
	});

	// A stack of cards has labels of every length. A chart that took whatever
	// the text left would be a different width on every card, and the shapes
	// would stop lining up down the right-hand edge.
	test("an inline sparkline takes a fixed column; a full-width one takes the row", () => {
		expect(kpiVariants({ layout: "inline" }).sparkline()).toContain("w-32");
		expect(kpiVariants({ layout: "inline" }).sparkline()).toContain("shrink-0");
		expect(kpiVariants({ layout: "below" }).sparkline()).toContain("w-full");
	});

	test("the stat takes the width beside an inline chart", () => {
		expect(kpiVariants({ layout: "inline" }).stat()).toContain("flex-1");
		expect(kpiVariants({ layout: "below" }).stat()).not.toContain("flex-1");
	});

	test("an inline sparkline is shorter than a full-width one at every size", () => {
		for (const size of KPI_SIZES) {
			const below = Number(step(kpiVariants({ layout: "below", size }).sparklineFrame(), "h"));
			const inline = Number(step(kpiVariants({ layout: "inline", size }).sparklineFrame(), "h"));
			expect(inline).toBeLessThan(below);
		}
	});
});

describe("kpiVariants group", () => {
	test("horizontal lays the metrics out in a row; vertical stacks them", () => {
		expect(kpiVariants({ orientation: "horizontal" }).group()).toContain("flex-row");
		expect(kpiVariants({ orientation: "vertical" }).group()).not.toContain("flex-row");
		expect(KPI_GROUP_ORIENTATIONS).toEqual(["horizontal", "vertical"]);
	});

	test("a separated group lets its rules be the spacing", () => {
		expect(kpiVariants({ separated: true }).group()).toContain("gap-0");
		expect(kpiVariants({ separated: false }).group()).toContain("gap-3");
	});

	test("a metric in a row takes an equal share of it", () => {
		expect(kpiVariants({ orientation: "horizontal" }).groupItem()).toContain("flex-1");
	});
});

describe("kpiVariants rule 1", () => {
	// A React Native View does not cascade colour to a Text descendant.
	test("carries no text treatment on a view slot", () => {
		for (const slots of everyCombination()) {
			for (const cls of [
				slots.header(),
				slots.icon(),
				slots.action(),
				slots.content(),
				slots.stat(),
				slots.trend(),
				slots.sparkline(),
				slots.sparklineFrame(),
				slots.group(),
			]) {
				expect(cls).not.toMatch(/(^|\s)text-/);
			}
		}
	});
});
