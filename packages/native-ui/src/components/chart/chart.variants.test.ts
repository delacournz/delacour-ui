import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import type { ChartConfig, ChartResolvedSeries } from "./chart.types";
import {
	applyChartColors,
	CHART_MAX_TOKEN_SERIES,
	CHART_SERIES_TOKENS,
	CHART_SIZES,
	chartAxisFontSize,
	chartSeriesToken,
	chartTickCount,
	chartTooltipOffset,
	chartVariants,
	partitionChartColors,
	resolveChartSeries,
} from "./chart.variants";

/** Slots that may carry a text colour. Rule 1: colour goes on the Text. */
const LABEL_SLOTS = ["legendLabel", "tooltipHeading", "tooltipName", "tooltipValue"] as const;

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
		const tooMany = series(Array.from({ length: CHART_MAX_TOKEN_SERIES + 1 }, () => "chart-1"));
		expect(() => partitionChartColors(tooMany)).toThrow(/at most 8/);
	});

	test("a chart of literals is unbounded", () => {
		const many = series(Array.from({ length: 20 }, () => "#123456"));
		expect(() => partitionChartColors(many)).not.toThrow();
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
