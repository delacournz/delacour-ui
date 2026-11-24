import { asNumber } from "@delacour/react-native-charts/core";
import type { ChartDatum, ChartTooltipRow } from "./chart.types";
import { formatPieValue, pieSlicePercent } from "./chart.variants";

/**
 * What a chart's text alternative is built from.
 *
 * A discriminated union because the two roots describe different things: a
 * cartesian chart is a set of series over a run of x, and a pie is a set of
 * shares of one whole. `override` is the caller's `accessibilityLabel`, and
 * an empty one counts as absent — a blank label is no name at all.
 */
export type ChartSummaryInput =
	| {
			readonly kind: "cartesian";
			readonly series: readonly { readonly key: string; readonly label: string }[];
			readonly data: readonly ChartDatum[];
			/** Prints a row's x — the axis' own formatter, so a Date reads as a date. */
			readonly formatX: (row: ChartDatum) => string;
			/** The tooltip's value formatter, when it has one. */
			readonly formatValue?: (value: unknown, key: string) => string;
			readonly override?: string;
	  }
	| {
			readonly kind: "pie";
			readonly series: readonly { readonly label: string }[];
			readonly values: readonly number[];
			readonly total: number;
			readonly override?: string;
	  };

/**
 * The sentence a screen reader speaks for a whole chart.
 *
 * A Skia canvas is one opaque view, so without this a chart is announced as
 * nothing at all. A cartesian chart names its x range, then each series'
 * lowest, highest and latest value — the three numbers a sighted reader takes
 * from a glance at a line. A pie names each slice with its whole-number share.
 * An `override` replaces all of it, verbatim.
 *
 * The words are English. There is no labels provider to translate them yet,
 * which is the reason the override exists.
 */
export function resolveChartSummary(input: ChartSummaryInput): string {
	if (input.override !== undefined && input.override !== "") return input.override;
	return input.kind === "pie" ? pieSummary(input) : cartesianSummary(input);
}

function cartesianSummary(input: Extract<ChartSummaryInput, { kind: "cartesian" }>): string {
	const { series, data, formatX, formatValue } = input;
	const first = data[0];
	const last = data[data.length - 1];
	if (first === undefined || last === undefined) return "Chart, no data.";

	const from = formatX(first);
	const to = formatX(last);
	const range = data.length === 1 || from === to ? from : `${from} to ${to}`;
	const print = (value: number, key: string): string => formatValue?.(value, key) ?? formatPieValue(value);

	const parts = series.map((entry) => {
		let low = Number.POSITIVE_INFINITY;
		let high = Number.NEGATIVE_INFINITY;
		let latest = Number.NaN;
		for (const row of data) {
			const value = asNumber(row[entry.key]);
			if (!Number.isFinite(value)) continue;
			if (value < low) low = value;
			if (value > high) high = value;
			latest = value;
		}
		if (!Number.isFinite(latest)) return `${entry.label}: no data.`;
		return `${entry.label}: lowest ${print(low, entry.key)}, highest ${print(high, entry.key)}, latest ${print(latest, entry.key)}.`;
	});

	return [`Chart, ${range}.`, ...parts].join(" ");
}

function pieSummary(input: Extract<ChartSummaryInput, { kind: "pie" }>): string {
	const { series, values, total } = input;
	if (series.length === 0 || !(total > 0)) return "Pie chart, no data.";
	const slices = series.map(
		(entry, index) => `${entry.label} ${Math.round(pieSlicePercent(values[index] ?? 0, total))}%`
	);
	return `Pie chart. ${slices.join(", ")}.`;
}

/**
 * One pie slice as a screen reader names it: the name, the value, the share.
 *
 * The same three things `PieChart.Tooltip` prints, through the same
 * formatters, so the announced slice and the drawn readout agree.
 */
export function pieSliceAccessibilityLabel(input: {
	readonly label: string;
	readonly value: number;
	readonly total: number;
	readonly formatValue?: (value: number, name: string) => string;
	readonly formatPercent?: (percent: number) => string;
}): string {
	const { label, value, total, formatValue, formatPercent } = input;
	const percent = pieSlicePercent(value, total);
	const printedValue = formatValue?.(value, label) ?? formatPieValue(value);
	const printedPercent = formatPercent?.(percent) ?? `${Math.round(percent)}%`;
	return `${label}, ${printedValue}, ${printedPercent}`;
}

/**
 * A tooltip row's value as `Chart.Tooltip` prints it.
 *
 * One function for the drawn readout and the spoken one, so the two cannot
 * drift: the caller's formatter when there is one, else the value as written,
 * and an empty string for a missing value.
 */
export function chartTooltipValueText(
	row: ChartTooltipRow,
	formatValue?: (value: unknown, key: string) => string
): string {
	return formatValue?.(row.value, row.key) ?? String(row.value ?? "");
}

/**
 * The tooltip's readout as one line of text — an adjustable chart's value.
 *
 * `Jan: Desktop 186, Mobile 80`. A row with nothing to print says so, rather
 * than leaving a label hanging with no number after it.
 */
export function resolveChartReadout(input: {
	readonly heading: string;
	readonly rows: readonly ChartTooltipRow[];
	readonly formatValue?: (value: unknown, key: string) => string;
}): string {
	const { heading, rows, formatValue } = input;
	const body = rows
		.map((row) => {
			const text = chartTooltipValueText(row, formatValue);
			return `${row.label} ${text === "" ? "no value" : text}`;
		})
		.join(", ");
	return heading === "" ? body : `${heading}: ${body}`;
}

/**
 * The datum an increment or a decrement moves to.
 *
 * From no selection (`-1`) the first increment lands on the first datum and the
 * first decrement on the last, so either swipe starts somewhere useful. It stops
 * at both ends rather than wrapping — a wrap would announce January straight
 * after December with nothing to say the series had ended. An index left past a
 * data set that shrank is pulled back inside it. No data, no index.
 */
export function stepChartIndex(current: number, direction: 1 | -1, count: number): number {
	if (count <= 0) return -1;
	if (current < 0) return direction > 0 ? 0 : count - 1;
	const next = Math.min(current, count - 1) + direction;
	return Math.min(count - 1, Math.max(0, next));
}
