import { describe, expect, test } from "bun:test";
import { formatDateTick } from "@delacour/charts/core";
import { declaredTokens, radiusMultiplier } from "../../styles/theme-tokens.test";
import type { ChartBarSpec, ChartConfig, ChartResolvedSeries } from "./chart.types";
import {
	AREA_FILL_OPACITY,
	AREA_STACKED_FILL_OPACITY,
	applyChartColors,
	BAR_RADIUS_MULTIPLIER,
	BAR_RADIUS_STEP,
	CANDLE_SENTIMENT_TOKENS,
	CHART_MAX_TOKEN_SERIES,
	CHART_SERIES_TOKENS,
	CHART_SIZES,
	chartAxisFontSize,
	chartSeriesToken,
	chartTickCount,
	chartTooltipOffset,
	chartVariants,
	formatPieValue,
	PIE_DEFAULT_INNER_RADIUS,
	partitionChartColors,
	pieInnerRadiusSpec,
	pieLabelText,
	pieSlicePercent,
	resolveAreaFill,
	resolveBarLayout,
	resolveBarRadius,
	resolveCategoryTickCount,
	resolveChartKeys,
	resolveChartSeries,
	resolveDomainDefaults,
	resolvePieSeries,
	resolveStackedAreaKeys,
	resolveTooltipRows,
	resolveXValueFormat,
} from "./chart.variants";

/** Slots that may carry a text colour. Rule 1: colour goes on the Text. */
const LABEL_SLOTS = [
	"legendLabel",
	"tooltipHeading",
	"tooltipName",
	"tooltipValue",
	"pieCenterValue",
	"pieCenterLabel",
] as const;

describe("chartVariants", () => {
	test("gives the frame a height token per size", () => {
		expect(chartVariants({ size: "sm" }).frame()).toContain("h-chart-sm");
		expect(chartVariants({ size: "md" }).frame()).toContain("h-chart-md");
		expect(chartVariants({ size: "lg" }).frame()).toContain("h-chart-lg");
	});

	test("defaults to the medium height", () => {
		expect(chartVariants().frame()).toContain("h-chart-md");
	});

	test("lets a caller's className win the merge", () => {
		// Registering `chart-md` with tailwind-merge is what makes this work; an
		// unregistered token would leave both classes and the winner undefined.
		expect(chartVariants().frame({ className: "h-72" })).toContain("h-72");
		expect(chartVariants().frame({ className: "h-72" })).not.toContain("h-chart-md");
	});

	test("puts a text colour only on the slots that render text", () => {
		// Rule 1: a View does not cascade colour in React Native, so a text colour
		// on a container is a class that does nothing and hides the bug.
		const slots = chartVariants();
		const labelSlots = new Set<string>(LABEL_SLOTS);
		for (const [name, slot] of Object.entries(slots)) {
			if (typeof slot !== "function") continue;
			const classes = slot();
			if (typeof classes !== "string") continue;
			if (/\btext-(foreground|muted-foreground|popover-foreground)\b/.test(classes)) {
				expect(labelSlots.has(name)).toBe(true);
			}
		}
	});

	test("paints the tooltip on the popover surface, not the card one", () => {
		// A tooltip floats above content, which is what `popover` means here.
		expect(chartVariants().tooltip()).toContain("bg-popover");
		expect(chartVariants().tooltip()).toContain("border-border");
	});
});

describe("chartSeriesToken", () => {
	test("walks the ramp in order", () => {
		expect(CHART_SERIES_TOKENS.map((_, index) => chartSeriesToken(index))).toEqual([...CHART_SERIES_TOKENS]);
	});

	test("cycles at five", () => {
		expect(chartSeriesToken(5)).toBe("chart-1");
		expect(chartSeriesToken(11)).toBe("chart-2");
	});

	test("is total for any index", () => {
		for (const index of [-3, 0, 1.7, 999]) {
			expect(CHART_SERIES_TOKENS).toContain(chartSeriesToken(index));
		}
	});
});

describe("the ramp is real", () => {
	// The highest-value assertion here. A renamed or half-declared chart token
	// would otherwise show up as an invisible series on a device, in one theme.
	test("every ramp token is declared in both light and dark", () => {
		for (const variant of ["light", "dark"] as const) {
			const declared = declaredTokens(variant);
			for (const token of CHART_SERIES_TOKENS) {
				expect(declared).toContain(token);
			}
		}
	});
});

describe("resolveChartSeries", () => {
	const config: ChartConfig = {
		desktop: { label: "Desktop" },
		mobile: { label: "Mobile", color: "chart-4" },
		other: { label: "Other", color: "#EC4899" },
	};

	test("assigns the ramp by position when no colour is named", () => {
		expect(resolveChartSeries({ a: { label: "A" }, b: { label: "B" } })).toEqual([
			{ key: "a", label: "A", color: "chart-1" },
			{ key: "b", label: "B", color: "chart-2" },
		]);
	});

	test("an explicit token overrides the position", () => {
		expect(resolveChartSeries(config)[1]?.color).toBe("chart-4");
	});

	test("a literal survives byte for byte", () => {
		expect(resolveChartSeries(config)[2]?.color).toBe("#EC4899");
	});

	test("falls back to the key when a series has no label", () => {
		expect(resolveChartSeries({ visits: { label: "" } })[0]?.label).toBe("visits");
	});

	test("yKeys narrows and reorders", () => {
		expect(resolveChartSeries(config, ["other", "desktop"]).map((series) => series.key)).toEqual(["other", "desktop"]);
	});

	test("ignores a yKey the config does not describe", () => {
		expect(resolveChartSeries(config, ["desktop", "ghost"])).toHaveLength(1);
	});

	test("cycles the ramp past five series", () => {
		const many = Object.fromEntries(
			Array.from({ length: 7 }, (_, index) => [`s${index}`, { label: `S${index}` }])
		) as ChartConfig;
		expect(resolveChartSeries(many)[5]?.color).toBe("chart-1");
	});
});

describe("partitionChartColors", () => {
	const series = (colors: string[]): ChartResolvedSeries[] =>
		colors.map((color, index) => ({ key: `k${index}`, label: `L${index}`, color }));

	test("pads the token list to exactly max, so the hook count never varies", () => {
		expect(partitionChartColors(series(["chart-1", "chart-2"])).tokens).toHaveLength(CHART_MAX_TOKEN_SERIES);
	});

	test("keeps literals out of the token list entirely", () => {
		const partition = partitionChartColors(series(["#EC4899", "chart-2"]));
		expect(partition.literals).toEqual({ k0: "#EC4899" });
		expect(partition.tokens[0]).toBe("chart-2");
	});

	test("treats a functional colour as a literal", () => {
		expect(partitionChartColors(series(["rgb(1 2 3)"])).literals.k0).toBe("rgb(1 2 3)");
	});

	test("throws by name past the cap rather than drawing a wrong colour", () => {
		const tooMany = series(Array.from({ length: CHART_MAX_TOKEN_SERIES + 1 }, (_, index) => `token-${index}`));
		expect(() => partitionChartColors(tooMany)).toThrow(/at most 8 distinct/);
	});

	test("a chart of literals is unbounded", () => {
		const many = series(Array.from({ length: 20 }, () => "#123456"));
		expect(() => partitionChartColors(many)).not.toThrow();
	});

	test("resolves a distinct token once, however many series wear it", () => {
		const partition = partitionChartColors(series(["chart-1", "chart-2", "chart-1", "chart-2", "chart-1"]));
		expect(partition.tokens.slice(0, 2)).toEqual(["chart-1", "chart-2"]);
		expect(partition.tokens[2]).toBe(CHART_SERIES_TOKENS[0]);
	});

	test("two series on one token share a slot", () => {
		const partition = partitionChartColors(series(["chart-1", "chart-3", "chart-1"]));
		expect(partition.slotOf["chart-1"]).toBe(0);
		expect(partition.slotOf["chart-3"]).toBe(1);
	});

	test("twenty series on the default ramp fit, because the ramp dedupes to five", () => {
		// A pie of twenty slices, or nine lines, walks the five-token ramp and
		// needs five slots — not twenty.
		const many = series(Array.from({ length: 20 }, (_, index) => chartSeriesToken(index)));
		const partition = partitionChartColors(many);
		expect(() => partitionChartColors(many)).not.toThrow();
		expect(Object.keys(partition.slotOf)).toHaveLength(CHART_SERIES_TOKENS.length);
	});

	test("nine distinct tokens still throw", () => {
		const nine = series([
			"chart-1",
			"chart-2",
			"chart-3",
			"chart-4",
			"chart-5",
			"primary",
			"success",
			"info",
			"warning",
		]);
		expect(() => partitionChartColors(nine)).toThrow(/at most 8 distinct/);
	});

	test("a literal never takes a slot", () => {
		const partition = partitionChartColors(series(["#EC4899", "rgb(1 2 3)", "chart-2"]));
		expect(partition.slotOf["#EC4899"]).toBeUndefined();
		expect(partition.slotOf["rgb(1 2 3)"]).toBeUndefined();
		expect(partition.slotOf["chart-2"]).toBe(0);
		expect(Object.keys(partition.slotOf)).toHaveLength(1);
	});

	test("slots follow first appearance, with literals interleaved", () => {
		const partition = partitionChartColors(series(["chart-4", "#000", "chart-2", "chart-4", "#fff", "chart-1"]));
		expect(partition.tokens.slice(0, 3)).toEqual(["chart-4", "chart-2", "chart-1"]);
		expect(partition.slotOf).toEqual({ "chart-4": 0, "chart-2": 1, "chart-1": 2 });
	});
});

describe("applyChartColors", () => {
	test("reassembles resolved values in the original order", () => {
		const series: ChartResolvedSeries[] = [
			{ key: "a", label: "A", color: "chart-1" },
			{ key: "b", label: "B", color: "#EC4899" },
			{ key: "c", label: "C", color: "chart-2" },
		];
		const partition = partitionChartColors(series);
		const resolved = ["oklch(1 0 0)", "oklch(2 0 0)", ...Array(6).fill("unused")];
		expect(applyChartColors(series, partition, resolved).map((entry) => entry.color)).toEqual([
			"oklch(1 0 0)",
			"#EC4899",
			"oklch(2 0 0)",
		]);
	});

	test("keeps the token name when the theme emits no value for it", () => {
		const series: ChartResolvedSeries[] = [{ key: "a", label: "A", color: "chart-1" }];
		expect(applyChartColors(series, partitionChartColors(series), [undefined])[0]?.color).toBe("chart-1");
	});

	test("series sharing a token read the same resolved slot", () => {
		const series: ChartResolvedSeries[] = [
			{ key: "a", label: "A", color: "chart-1" },
			{ key: "b", label: "B", color: "chart-2" },
			{ key: "c", label: "C", color: "chart-1" },
		];
		const partition = partitionChartColors(series);
		const resolved = ["oklch(1 0 0)", "oklch(2 0 0)", ...Array(6).fill("unused")];
		expect(applyChartColors(series, partition, resolved).map((entry) => entry.color)).toEqual([
			"oklch(1 0 0)",
			"oklch(2 0 0)",
			"oklch(1 0 0)",
		]);
	});

	test("preserves order across a ramp that wraps", () => {
		const series = Array.from({ length: 7 }, (_, index) => ({
			key: `k${index}`,
			label: `L${index}`,
			color: chartSeriesToken(index),
		}));
		const partition = partitionChartColors(series);
		const resolved = CHART_SERIES_TOKENS.map((token) => `resolved(${token})`);
		expect(applyChartColors(series, partition, [...resolved, "x", "y", "z"]).map((entry) => entry.color)).toEqual([
			"resolved(chart-1)",
			"resolved(chart-2)",
			"resolved(chart-3)",
			"resolved(chart-4)",
			"resolved(chart-5)",
			"resolved(chart-1)",
			"resolved(chart-2)",
		]);
	});
});

describe("chartTooltipOffset", () => {
	const frame = { frameWidth: 300, frameHeight: 200, width: 80, height: 40 };

	test("sits to the right of the cursor with room to spare", () => {
		expect(chartTooltipOffset({ ...frame, x: 50, y: 100 }).x).toBe(62);
	});

	test("flips to the left near the right edge", () => {
		expect(chartTooltipOffset({ ...frame, x: 280, y: 100 }).x).toBe(188);
	});

	test("clamps rather than leaving the frame at either edge", () => {
		expect(chartTooltipOffset({ ...frame, x: 2, y: 100 }).x).toBeGreaterThanOrEqual(0);
		const right = chartTooltipOffset({ ...frame, x: 299, y: 100 }).x;
		expect(right).toBeGreaterThanOrEqual(0);
		expect(right + frame.width).toBeLessThanOrEqual(frame.frameWidth);
	});

	test("centres vertically on the cursor and clamps at both ends", () => {
		expect(chartTooltipOffset({ ...frame, x: 50, y: 100 }).y).toBe(80);
		expect(chartTooltipOffset({ ...frame, x: 50, y: 0 }).y).toBe(0);
		expect(chartTooltipOffset({ ...frame, x: 50, y: 200 }).y).toBe(160);
	});

	test("returns finite numbers for a frame with no size", () => {
		// The first frame, before onLayout. A NaN here freezes the tooltip.
		const offset = chartTooltipOffset({ x: 0, y: 0, width: 0, height: 0, frameWidth: 0, frameHeight: 0 });
		expect(Number.isFinite(offset.x)).toBe(true);
		expect(Number.isFinite(offset.y)).toBe(true);
	});

	test("survives a non-finite measurement", () => {
		const offset = chartTooltipOffset({ ...frame, x: 10, y: 10, width: Number.NaN });
		expect(Number.isFinite(offset.x)).toBe(true);
	});
});

describe("size-derived numbers", () => {
	test("the axis font and tick count both grow with the chart", () => {
		const fonts = CHART_SIZES.map(chartAxisFontSize);
		const ticks = CHART_SIZES.map(chartTickCount);
		expect(fonts).toEqual([...fonts].sort((a, b) => a - b));
		expect(ticks).toEqual([...ticks].sort((a, b) => a - b));
	});

	test("a small chart asks for fewer ticks, because its labels would collide", () => {
		expect(chartTickCount("sm")).toBeLessThan(chartTickCount("lg"));
	});
});

describe("resolveXValueFormat", () => {
	const dated = (days: number[]) => days.map((day) => ({ at: new Date(2026, 0, day), v: day }));

	test("formats a Date as a date, not as an RFC timestamp", () => {
		// `String(new Date())` is "Tue Jan 20 2026 00:00:00 GMT+0000" — a full
		// timestamp beside a two-digit value, in a box sized for neither.
		const format = resolveXValueFormat(dated([1, 15, 30]), "at");
		expect(format({ at: new Date(2026, 0, 20) })).toBe("20 Jan");
	});

	test("matches the axis at the same granularity", () => {
		// The heading has to read `20 Jan` directly above an axis reading
		// `18 Jan`, not as a second rendering of the same instant.
		const rows = dated([1, 15, 30]);
		const span = (rows.at(-1)?.at.getTime() ?? 0) - (rows[0]?.at.getTime() ?? 0);
		const format = resolveXValueFormat(rows, "at");
		for (const row of rows) {
			expect(format(row)).toBe(formatDateTick(row.at.getTime(), span));
		}
	});

	test("uses a clock for an intraday span", () => {
		const rows = [{ at: new Date(2026, 0, 1, 9, 0) }, { at: new Date(2026, 0, 1, 15, 30) }];
		expect(resolveXValueFormat(rows, "at")(rows[1] as (typeof rows)[number])).toBe("15:30");
	});

	test("uses a year for a multi-year span", () => {
		const rows = [{ at: new Date(2018, 0, 1) }, { at: new Date(2026, 0, 1) }];
		expect(resolveXValueFormat(rows, "at")(rows[1] as (typeof rows)[number])).toBe("2026");
	});

	test("shows a date rather than a clock when a single row gives no span", () => {
		const rows = [{ at: new Date(2026, 0, 20) }];
		expect(resolveXValueFormat(rows, "at")(rows[0] as (typeof rows)[number])).toBe("20 Jan");
	});

	test("strips float noise from a numeric x", () => {
		expect(resolveXValueFormat([{ t: 0 }], "t")({ t: 0.1 + 0.2 })).toBe("0.3");
	});

	test("passes a label through untouched", () => {
		expect(resolveXValueFormat([{ m: "Jan" }], "m")({ m: "Jan" })).toBe("Jan");
	});

	test("returns an empty heading for a missing field rather than 'undefined'", () => {
		expect(resolveXValueFormat([{ m: "Jan" }], "m")({})).toBe("");
		expect(resolveXValueFormat(dated([1, 2]), "at")({})).toBe("");
	});
});

describe("resolvePieSeries", () => {
	const rows = [
		{ browser: "chrome", visitors: 275 },
		{ browser: "safari", visitors: 200 },
		{ browser: "firefox", visitors: 187 },
	];

	test("walks the ramp in data order", () => {
		const { series } = resolvePieSeries(rows, "browser", "visitors", {});
		expect(series.map((entry) => entry.color)).toEqual(["chart-1", "chart-2", "chart-3"]);
		expect(series.map((entry) => entry.key)).toEqual(["chrome", "safari", "firefox"]);
	});

	test("an unnamed datum keeps its name as the label and its ramp slot", () => {
		const { series } = resolvePieSeries(rows, "browser", "visitors", { safari: { label: "Safari" } });
		expect(series[0]?.label).toBe("chrome");
		expect(series[1]?.label).toBe("Safari");
		expect(series[2]?.color).toBe("chart-3");
	});

	test("a config entry overrides the colour by name without moving the ramp", () => {
		const { series } = resolvePieSeries(rows, "browser", "visitors", { safari: { label: "Safari", color: "#F00" } });
		expect(series.map((entry) => entry.color)).toEqual(["chart-1", "#F00", "chart-3"]);
	});

	test("sums the values", () => {
		const { values, total } = resolvePieSeries(rows, "browser", "visitors", {});
		expect(values).toEqual([275, 200, 187]);
		expect(total).toBe(662);
	});

	test("drops a negative, NaN, null or missing value", () => {
		const { series, values, total } = resolvePieSeries(
			[
				{ name: "a", value: 10 },
				{ name: "b", value: -5 },
				{ name: "c", value: Number.NaN },
				{ name: "d", value: null },
				{ name: "e" },
				{ name: "f", value: "7" },
			],
			"name",
			"value",
			{}
		);
		expect(series.map((entry) => entry.key)).toEqual(["a", "f"]);
		expect(values).toEqual([10, 7]);
		expect(total).toBe(17);
	});

	test("a zero stays, so its legend row and its slice index line up", () => {
		const { series, values } = resolvePieSeries(
			[
				{ name: "a", value: 0 },
				{ name: "b", value: 4 },
			],
			"name",
			"value",
			{}
		);
		expect(series.map((entry) => entry.key)).toEqual(["a", "b"]);
		expect(values).toEqual([0, 4]);
	});

	test("keys a numeric or missing name as a string", () => {
		const { series } = resolvePieSeries([{ id: 2024, value: 1 }, { value: 2 }], "id", "value", {
			2024: { label: "This year" },
		});
		expect(series[0]?.key).toBe("2024");
		expect(series[0]?.label).toBe("This year");
		expect(series[1]?.key).toBe("1");
		expect(series[1]?.label).toBe("1");
	});

	test("two rows with one name keep distinct keys", () => {
		const { series } = resolvePieSeries(
			[
				{ name: "a", value: 1 },
				{ name: "a", value: 2 },
			],
			"name",
			"value",
			{}
		);
		expect(new Set(series.map((entry) => entry.key)).size).toBe(2);
		expect(series.map((entry) => entry.label)).toEqual(["a", "a"]);
	});

	test("empty data is an empty series with a zero total", () => {
		expect(resolvePieSeries([], "name", "value", {})).toEqual({ series: [], values: [], total: 0 });
	});
});

describe("formatPieValue", () => {
	test("groups digits in threes, the way a headline count is written", () => {
		expect(formatPieValue(1240)).toBe("1,240");
		expect(formatPieValue(1125)).toBe("1,125");
		expect(formatPieValue(1234567)).toBe("1,234,567");
	});

	test("leaves a short number alone", () => {
		expect(formatPieValue(0)).toBe("0");
		expect(formatPieValue(980)).toBe("980");
	});

	test("keeps a fraction, ungrouped, after the point", () => {
		expect(formatPieValue(1234.5)).toBe("1,234.5");
		expect(formatPieValue(0.1 + 0.2)).toBe("0.3");
	});

	test("keeps the sign and prints nothing for a non-number", () => {
		expect(formatPieValue(-1240)).toBe("-1,240");
		expect(formatPieValue(Number.NaN)).toBe("");
	});
});

describe("pieSlicePercent", () => {
	test("is the value's share of the total, in percent", () => {
		expect(pieSlicePercent(25, 100)).toBe(25);
		expect(pieSlicePercent(1, 3)).toBeCloseTo(33.333, 2);
	});

	test("is zero when the total is zero", () => {
		expect(pieSlicePercent(5, 0)).toBe(0);
		expect(pieSlicePercent(0, 0)).toBe(0);
	});
});

describe("pieLabelText", () => {
	const slice = { label: "Chrome", value: 275.5, fraction: 0.4162 };

	test("prints a percentage by default, rounded to a whole number", () => {
		expect(pieLabelText(undefined, slice)).toBe("42%");
		expect(pieLabelText("percent", slice)).toBe("42%");
	});

	test("prints the value through the tick formatter", () => {
		expect(pieLabelText("value", slice)).toBe("275.5");
	});

	test("prints the label", () => {
		expect(pieLabelText("label", slice)).toBe("Chrome");
	});

	test("defers to a function", () => {
		expect(pieLabelText((current) => `${current.label}!`, slice)).toBe("Chrome!");
	});
});

describe("pieInnerRadiusSpec", () => {
	test("turns a fraction into the engine's percentage", () => {
		expect(pieInnerRadiusSpec(0.6)).toBe("60%");
		expect(pieInnerRadiusSpec(0.605)).toBe("61%");
	});

	test("defaults to a solid pie", () => {
		expect(PIE_DEFAULT_INNER_RADIUS).toBe(0);
		expect(pieInnerRadiusSpec(PIE_DEFAULT_INNER_RADIUS)).toBe("0%");
	});

	test("clamps to the unit interval and ignores a non-number", () => {
		expect(pieInnerRadiusSpec(1.4)).toBe("100%");
		expect(pieInnerRadiusSpec(-0.2)).toBe("0%");
		expect(pieInnerRadiusSpec(Number.NaN)).toBe("0%");
	});
});

describe("pie slots", () => {
	test("centres the hole content over the frame without taking touches", () => {
		expect(chartVariants().pieCenter()).toContain("absolute");
		expect(chartVariants().pieCenter()).toContain("items-center");
		expect(chartVariants().pieCenter()).toContain("justify-center");
	});

	test("the centre value is on the type scale, the caption is muted", () => {
		expect(chartVariants().pieCenterValue()).toContain("text-foreground");
		expect(chartVariants().pieCenterLabel()).toContain("text-muted-foreground");
	});
});

describe("resolveBarLayout", () => {
	const bar = (yKey: string, stackId?: string): ChartBarSpec => (stackId === undefined ? { yKey } : { yKey, stackId });

	test("no bars is no layout", () => {
		expect(resolveBarLayout([])).toEqual({ mode: "none", keys: [], slotOf: {} });
	});

	test("one bar stands alone", () => {
		const layout = resolveBarLayout([bar("a")]);
		expect(layout.mode).toBe("single");
		expect(layout.keys).toEqual(["a"]);
		expect(layout.slotOf.a).toEqual({ groupIndex: 0, groupCount: 1 });
	});

	test("sibling bars group side by side, in placement order", () => {
		const layout = resolveBarLayout([bar("a"), bar("b"), bar("c")]);
		expect(layout.mode).toBe("grouped");
		expect(layout.keys).toEqual(["a", "b", "c"]);
		expect(layout.slotOf.b).toEqual({ groupIndex: 1, groupCount: 3 });
		expect(layout.stackId).toBeUndefined();
	});

	test("bars sharing a stackId stack, bottom first", () => {
		const layout = resolveBarLayout([bar("a", "t"), bar("b", "t")]);
		expect(layout.mode).toBe("stacked");
		expect(layout.stackId).toBe("t");
		expect(layout.slotOf.a).toEqual({ groupIndex: 0, groupCount: 1, stackIndex: 0 });
		expect(layout.slotOf.b).toEqual({ groupIndex: 0, groupCount: 1, stackIndex: 1 });
	});

	test("a lone bar with a stackId is still a stack of one, so its key reaches stackKeys", () => {
		expect(resolveBarLayout([bar("a", "t")]).mode).toBe("stacked");
	});

	test("two stackIds throw by name — one stack per chart", () => {
		expect(() => resolveBarLayout([bar("a", "t"), bar("b", "u")])).toThrow(/one stack per chart/);
	});

	test("a stack beside a loose bar throws the same way", () => {
		expect(() => resolveBarLayout([bar("a", "t"), bar("b")])).toThrow(/one stack per chart/);
	});

	test("the same yKey twice throws rather than drawing it twice", () => {
		expect(() => resolveBarLayout([bar("a"), bar("a")])).toThrow(/yKey="a".*twice/);
	});
});

describe("resolveStackedAreaKeys", () => {
	const none = resolveBarLayout([]);

	test("areas without a stackId stack nothing", () => {
		expect(resolveStackedAreaKeys([{ yKey: "a" }, { yKey: "b" }], none)).toEqual([]);
	});

	test("areas sharing a stackId stack in placement order", () => {
		expect(
			resolveStackedAreaKeys(
				[
					{ yKey: "a", stackId: "s" },
					{ yKey: "b", stackId: "s" },
				],
				none
			)
		).toEqual(["a", "b"]);
	});

	test("a loose area beside a stacked one is left out of the stack", () => {
		expect(resolveStackedAreaKeys([{ yKey: "a", stackId: "s" }, { yKey: "b" }], none)).toEqual(["a"]);
	});

	test("two area stackIds throw by name", () => {
		expect(() =>
			resolveStackedAreaKeys(
				[
					{ yKey: "a", stackId: "s" },
					{ yKey: "b", stackId: "t" },
				],
				none
			)
		).toThrow(/one stack per chart/);
	});

	test("an area stack beside a bar stack throws — the chart has one stack", () => {
		const bars = resolveBarLayout([
			{ yKey: "x", stackId: "t" },
			{ yKey: "y", stackId: "t" },
		]);
		expect(() => resolveStackedAreaKeys([{ yKey: "a", stackId: "s" }], bars)).toThrow(/one stack per chart/);
	});

	test("unstacked areas beside a bar stack are fine", () => {
		const bars = resolveBarLayout([{ yKey: "x", stackId: "t" }]);
		expect(resolveStackedAreaKeys([{ yKey: "a" }], bars)).toEqual([]);
	});
});

describe("resolveChartKeys", () => {
	test("is the series keys when there is no candlestick", () => {
		expect(resolveChartKeys(["a", "b"], null)).toEqual(["a", "b"]);
	});

	test("appends the candle fields the series do not already name", () => {
		const keys = resolveChartKeys(["close"], { open: "open", high: "high", low: "low", close: "close" });
		expect(keys).toEqual(["close", "open", "high", "low"]);
	});

	test("never repeats a key", () => {
		const keys = resolveChartKeys(["a"], { open: "o", high: "o", low: "l", close: "a" });
		expect(keys).toEqual(["a", "o", "l"]);
	});
});

describe("bar corners", () => {
	// Restated in TypeScript for the reason `checkbox.variants.ts` restates its
	// own: the corner scale is `@theme inline`, so only `--radius` reaches the
	// runtime. Pinned against `tokens.css` so retuning the scale fails here.
	test("multiplies --radius by what tokens.css says the step multiplies it by", () => {
		for (const size of CHART_SIZES) {
			expect(BAR_RADIUS_MULTIPLIER[size]).toBe(radiusMultiplier(BAR_RADIUS_STEP[size]));
		}
	});

	test("a smaller chart wears a tighter corner, never a looser one", () => {
		const multipliers = CHART_SIZES.map((size) => BAR_RADIUS_MULTIPLIER[size]);
		expect([...multipliers].sort((a, b) => a - b)).toEqual(multipliers);
	});

	test("follows --radius, so a pasted theme moves the bars with the buttons", () => {
		expect(resolveBarRadius("md", 10)).toBe(10 * BAR_RADIUS_MULTIPLIER.md);
		expect(resolveBarRadius("md", 20)).toBe(20 * BAR_RADIUS_MULTIPLIER.md);
	});

	test("rounded={false} is square, a number is that number", () => {
		expect(resolveBarRadius("lg", 10, false)).toBe(0);
		expect(resolveBarRadius("lg", 10, 3)).toBe(3);
		expect(resolveBarRadius("lg", 10, true)).toBe(10 * BAR_RADIUS_MULTIPLIER.lg);
	});

	test("never goes negative and survives a missing --radius", () => {
		expect(resolveBarRadius("md", Number.NaN)).toBe(0);
		expect(resolveBarRadius("md", 10, -4)).toBe(0);
	});
});

describe("candle sentiment tokens", () => {
	test("borrow tokens every theme variant declares", () => {
		for (const variant of ["light", "dark"] as const) {
			const declared = declaredTokens(variant);
			for (const token of Object.values(CANDLE_SENTIMENT_TOKENS)) {
				expect(declared).toContain(token);
			}
		}
	});

	test("name one token per sentiment", () => {
		expect(Object.keys(CANDLE_SENTIMENT_TOKENS).sort()).toEqual(["negative", "neutral", "positive"]);
	});
});

describe("resolveTooltipRows", () => {
	const series: ChartResolvedSeries[] = [
		{ key: "desktop", label: "Desktop", color: "#111" },
		{ key: "mobile", label: "Mobile", color: "#222" },
	];
	const keys = { open: "o", high: "h", low: "l", close: "c" };
	const colors = { positive: "up", negative: "down", neutral: "flat" };

	test("one row per series without a candlestick", () => {
		const rows = resolveTooltipRows(series, null, { desktop: 1, mobile: 2 });
		expect(rows).toEqual([
			{ key: "desktop", label: "Desktop", color: "#111", value: 1 },
			{ key: "mobile", label: "Mobile", color: "#222", value: 2 },
		]);
	});

	test("an absent row leaves the values undefined rather than throwing", () => {
		expect(resolveTooltipRows(series, null, undefined).map((row) => row.value)).toEqual([undefined, undefined]);
	});

	test("prints open, high, low and close in that order, swatched by the candle's sentiment", () => {
		const candle = { keys, colors };
		const rows = resolveTooltipRows([{ key: "c", label: "Price", color: "#333" }], candle, { o: 1, h: 3, l: 0, c: 2 });
		expect(rows.map((row) => row.label)).toEqual(["Open", "High", "Low", "Close"]);
		expect(rows.map((row) => row.value)).toEqual([1, 3, 0, 2]);
		expect(rows.every((row) => row.color === "up")).toBe(true);
	});

	test("a falling candle swatches down, a flat one neutral", () => {
		const candle = { keys, colors };
		expect(resolveTooltipRows([], candle, { o: 2, c: 1 })[0]?.color).toBe("down");
		expect(resolveTooltipRows([], candle, { o: 2, c: 2 })[0]?.color).toBe("flat");
		expect(resolveTooltipRows([], candle, undefined)[0]?.color).toBe("flat");
	});

	test("a series that is not a candle field still gets its own row, after the candle", () => {
		const candle = { keys, colors };
		const rows = resolveTooltipRows(
			[
				{ key: "c", label: "Price", color: "#333" },
				{ key: "volume", label: "Volume", color: "#444" },
			],
			candle,
			{ o: 1, h: 3, l: 0, c: 2, volume: 9 }
		);
		expect(rows.map((row) => row.key)).toEqual(["o", "h", "l", "c", "volume"]);
		expect(rows[4]?.color).toBe("#444");
	});
});

describe("resolveCategoryTickCount", () => {
	test("labels every category on a bar chart", () => {
		// A bar's category name is that bar's label. Downsampling six months to
		// four ticks drops Feb and May, and a bar with no name under it reads
		// as a bug rather than as a tick budget.
		expect(resolveCategoryTickCount("sm", 6, true)).toBe(6);
		expect(resolveCategoryTickCount("sm", 4, true)).toBe(4);
		expect(resolveCategoryTickCount("md", 5, true)).toBe(5);
	});

	test("caps at twelve, where the labels would collide anyway", () => {
		expect(resolveCategoryTickCount("lg", 30, true)).toBe(12);
	});

	test("never asks for fewer ticks than the size would", () => {
		for (const size of CHART_SIZES) {
			expect(resolveCategoryTickCount(size, 1, true)).toBe(chartTickCount(size));
			expect(resolveCategoryTickCount(size, 0, true)).toBe(chartTickCount(size));
		}
	});

	test("a chart without bands keeps the size's count", () => {
		for (const size of CHART_SIZES) {
			expect(resolveCategoryTickCount(size, 6, false)).toBe(chartTickCount(size));
		}
	});
});

describe("resolveAreaFill", () => {
	test("a lone area fades out from a light top", () => {
		expect(resolveAreaFill({ stacked: false })).toEqual({ gradient: true, opacity: AREA_FILL_OPACITY });
	});

	test("a stacked band is flat and darker, so the bands stay distinct", () => {
		// Three bands each fading to transparent over the full plot height
		// blur into one wash; nothing says where one series ends.
		const fill = resolveAreaFill({ stacked: true });
		expect(fill.gradient).toBe(false);
		expect(fill.opacity).toBe(AREA_STACKED_FILL_OPACITY);
		expect(AREA_STACKED_FILL_OPACITY).toBeGreaterThan(AREA_FILL_OPACITY);
	});

	test("an explicit gradient or opacity wins either way", () => {
		expect(resolveAreaFill({ stacked: true, gradient: true })).toEqual({
			gradient: true,
			opacity: AREA_STACKED_FILL_OPACITY,
		});
		expect(resolveAreaFill({ stacked: true, opacity: 0.9 }).opacity).toBe(0.9);
		expect(resolveAreaFill({ stacked: false, gradient: false, opacity: 0.5 })).toEqual({
			gradient: false,
			opacity: 0.5,
		});
	});
});

describe("resolveDomainDefaults", () => {
	const none = resolveBarLayout([]);
	const single = resolveBarLayout([{ yKey: "a" }]);
	const keys = { open: "o", high: "h", low: "l", close: "c" };

	test("a line chart pads nothing and leaves includeZero alone", () => {
		expect(resolveDomainDefaults({ bars: none, candlestick: null, scatter: false })).toEqual({
			includeZero: undefined,
			domainPadding: undefined,
		});
	});

	test("bars pull zero in and pad x by half a step", () => {
		const defaults = resolveDomainDefaults({ bars: single, candlestick: null, scatter: false });
		expect(defaults.includeZero).toBe(true);
		expect(defaults.domainPadding).toEqual({ x: 0.5 });
	});

	test("a scatter pads x so the outermost dots clear the plot's edges, but does not pull zero in", () => {
		const defaults = resolveDomainDefaults({ bars: none, candlestick: null, scatter: true });
		expect(defaults.includeZero).toBeUndefined();
		expect(defaults.domainPadding).toEqual({ x: 0.5 });
	});

	test("candles keep the data's own extent, padded a tenth each way", () => {
		// Prices in the 140–160 band on an axis from zero are a thin strip.
		const defaults = resolveDomainDefaults({ bars: none, candlestick: keys, scatter: false });
		expect(defaults.includeZero).toBeUndefined();
		expect(defaults.domainPadding).toEqual({ x: 0.5, y: 0.1 });
	});

	test("an explicit y domain turns the candle's y padding off", () => {
		const defaults = resolveDomainDefaults({
			bars: none,
			candlestick: keys,
			scatter: false,
			domain: { y: [100, 200] },
		});
		expect(defaults.domainPadding).toEqual({ x: 0.5 });
	});

	test("the caller's includeZero wins over every default", () => {
		expect(
			resolveDomainDefaults({ bars: single, candlestick: null, scatter: false, includeZero: false }).includeZero
		).toBe(false);
		expect(
			resolveDomainDefaults({ bars: none, candlestick: keys, scatter: false, includeZero: true }).includeZero
		).toBe(true);
	});

	test("bars beside candles still pull zero in — the bars need it", () => {
		expect(resolveDomainDefaults({ bars: single, candlestick: keys, scatter: false }).includeZero).toBe(true);
	});
});
