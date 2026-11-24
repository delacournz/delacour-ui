import { describe, expect, test } from "bun:test";
import type { ChartTooltipRow } from "./chart.types";
import {
	chartTooltipValueText,
	pieSliceAccessibilityLabel,
	resolveChartReadout,
	resolveChartSummary,
	stepChartIndex,
} from "./chart-accessibility";

const rows = [
	{ month: "Jan", desktop: 186, mobile: 80 },
	{ month: "Feb", desktop: 305, mobile: 200 },
	{ month: "Mar", desktop: 237, mobile: null },
	{ month: "Apr", desktop: 73, mobile: 190 },
];

const desktop = { key: "desktop", label: "Desktop" };
const series = [desktop, { key: "mobile", label: "Mobile" }];

const formatX = (row: Record<string, unknown>): string => String(row.month);

describe("resolveChartSummary — cartesian", () => {
	test("names the x range, then each series' lowest, highest and latest", () => {
		expect(resolveChartSummary({ kind: "cartesian", series, data: rows, formatX })).toBe(
			"Chart, Jan to Apr. Desktop: lowest 73, highest 305, latest 73. Mobile: lowest 80, highest 200, latest 190."
		);
	});

	test("latest is the last readable value, skipping a gap at the end", () => {
		const gappy = [...rows, { month: "May", desktop: null, mobile: undefined }];
		expect(resolveChartSummary({ kind: "cartesian", series, data: gappy, formatX })).toBe(
			"Chart, Jan to May. Desktop: lowest 73, highest 305, latest 73. Mobile: lowest 80, highest 200, latest 190."
		);
	});

	test("groups digits in threes by default", () => {
		const big = [
			{ month: "Jan", desktop: 1240 },
			{ month: "Feb", desktop: 12_500.5 },
		];
		expect(resolveChartSummary({ kind: "cartesian", series: [desktop], data: big, formatX })).toBe(
			"Chart, Jan to Feb. Desktop: lowest 1,240, highest 12,500.5, latest 12,500.5."
		);
	});

	test("prints values through the tooltip's formatter when one is given", () => {
		const formatValue = (value: unknown, key: string): string => `${key}=${String(value)}`;
		expect(
			resolveChartSummary({ kind: "cartesian", series: [desktop], data: rows.slice(0, 2), formatX, formatValue })
		).toBe("Chart, Jan to Feb. Desktop: lowest desktop=186, highest desktop=305, latest desktop=305.");
	});

	test("one row names one x, not a range", () => {
		expect(resolveChartSummary({ kind: "cartesian", series: [desktop], data: rows.slice(0, 1), formatX })).toBe(
			"Chart, Jan. Desktop: lowest 186, highest 186, latest 186."
		);
	});

	test("a series with no readable value says so rather than printing NaN", () => {
		const empty = [{ month: "Jan", desktop: null }];
		expect(resolveChartSummary({ kind: "cartesian", series: [desktop], data: empty, formatX })).toBe(
			"Chart, Jan. Desktop: no data."
		);
	});

	test("no rows at all is one short sentence", () => {
		expect(resolveChartSummary({ kind: "cartesian", series, data: [], formatX })).toBe("Chart, no data.");
	});

	test("an override wins verbatim", () => {
		expect(resolveChartSummary({ kind: "cartesian", series, data: rows, formatX, override: "Traffic, rising" })).toBe(
			"Traffic, rising"
		);
	});

	test("an empty override falls back to the generated summary", () => {
		expect(resolveChartSummary({ kind: "cartesian", series, data: [], formatX, override: "" })).toBe("Chart, no data.");
	});
});

describe("resolveChartSummary — pie", () => {
	test("names every slice with its whole-number share", () => {
		expect(
			resolveChartSummary({
				kind: "pie",
				series: [{ label: "Chrome" }, { label: "Safari" }, { label: "Other" }],
				values: [275, 200, 25],
				total: 500,
			})
		).toBe("Pie chart. Chrome 55%, Safari 40%, Other 5%.");
	});

	test("no slices, or a zero total, is no data", () => {
		expect(resolveChartSummary({ kind: "pie", series: [], values: [], total: 0 })).toBe("Pie chart, no data.");
		expect(resolveChartSummary({ kind: "pie", series: [{ label: "A" }], values: [0], total: 0 })).toBe(
			"Pie chart, no data."
		);
	});

	test("an override wins verbatim", () => {
		expect(
			resolveChartSummary({ kind: "pie", series: [{ label: "A" }], values: [1], total: 1, override: "Share" })
		).toBe("Share");
	});
});

describe("pieSliceAccessibilityLabel", () => {
	test("is the name, the grouped value and the whole-number share", () => {
		expect(pieSliceAccessibilityLabel({ label: "Chrome", value: 1240, total: 2000 })).toBe("Chrome, 1,240, 62%");
	});

	test("prints through the caller's formatters", () => {
		expect(
			pieSliceAccessibilityLabel({
				label: "Chrome",
				value: 1240,
				total: 2000,
				formatValue: (value) => `$${value}`,
				formatPercent: (percent) => `${percent.toFixed(1)} percent`,
			})
		).toBe("Chrome, $1240, 62.0 percent");
	});
});

const desktopRow: ChartTooltipRow = { key: "desktop", label: "Desktop", color: "#000", value: 186 };
const mobileRow: ChartTooltipRow = { key: "mobile", label: "Mobile", color: "#111", value: null };
const tooltipRows = [desktopRow, mobileRow];

describe("chartTooltipValueText", () => {
	test("prints the value as written, and nothing for a missing one", () => {
		expect(chartTooltipValueText(desktopRow)).toBe("186");
		expect(chartTooltipValueText(mobileRow)).toBe("");
	});

	test("defers to the formatter, with the key", () => {
		expect(chartTooltipValueText(desktopRow, (value, key) => `${key}:${String(value)}`)).toBe("desktop:186");
	});
});

describe("resolveChartReadout", () => {
	test("is the heading, then each row's label and value — what the tooltip shows", () => {
		expect(resolveChartReadout({ heading: "Jan", rows: tooltipRows })).toBe("Jan: Desktop 186, Mobile no value");
	});

	test("drops an empty heading", () => {
		expect(resolveChartReadout({ heading: "", rows: tooltipRows.slice(0, 1) })).toBe("Desktop 186");
	});

	test("uses the tooltip's value formatter", () => {
		expect(
			resolveChartReadout({ heading: "Jan", rows: tooltipRows.slice(0, 1), formatValue: (value) => `${value} visits` })
		).toBe("Jan: Desktop 186 visits");
	});
});

describe("stepChartIndex", () => {
	test("the first increment lands on the first datum, the first decrement on the last", () => {
		expect(stepChartIndex(-1, 1, 5)).toBe(0);
		expect(stepChartIndex(-1, -1, 5)).toBe(4);
	});

	test("moves one datum and stops at either end", () => {
		expect(stepChartIndex(2, 1, 5)).toBe(3);
		expect(stepChartIndex(2, -1, 5)).toBe(1);
		expect(stepChartIndex(4, 1, 5)).toBe(4);
		expect(stepChartIndex(0, -1, 5)).toBe(0);
	});

	test("an index past a shrunk data set comes back inside it", () => {
		expect(stepChartIndex(9, -1, 5)).toBe(3);
		expect(stepChartIndex(9, 1, 5)).toBe(4);
	});

	test("no data has no index", () => {
		expect(stepChartIndex(-1, 1, 0)).toBe(-1);
		expect(stepChartIndex(3, -1, 0)).toBe(-1);
	});
});
