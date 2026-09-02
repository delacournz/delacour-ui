import { isLiteralColor } from "../../lib/color";
import { tv } from "../../lib/tv";
import type { ChartConfig, ChartResolvedSeries, ChartTooltipInput } from "./chart.types";

/**
 * The series ramp, in the order a chart assigns it.
 *
 * Five, because five is what shadcn's palette declares and this package's token
 * vocabulary is shadcn's. A sixth would not survive a pasted theme: a designer
 * copying a tweakcn palette supplies `--chart-1` through `--chart-5` and
 * nothing else, so a six-series chart would draw five themed lines and one
 * stranger. Past five the ramp cycles, and a caller who genuinely needs six
 * distinguishable series names the colours explicitly.
 */
export const CHART_SERIES_TOKENS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;

export type ChartSeriesToken = (typeof CHART_SERIES_TOKENS)[number];

export const CHART_SIZES = ["sm", "md", "lg"] as const;
export type ChartSize = (typeof CHART_SIZES)[number];

/**
 * The curves worth offering on a themed chart.
 *
 * A curated subset of what `@delacour/charts` can draw. The engine also exposes
 * `basis`, `cardinal` and the bump curves; they are omitted here because
 * `basis` does not pass through its own data — a scrub dot on it sits off every
 * datum — and the rest are variations nobody asks for by name. A caller who
 * wants one still passes it: `curve` takes the engine's full `CurveType`.
 */
export const CHART_CURVES = ["monotone", "linear", "natural", "step"] as const;
export type ChartCurve = (typeof CHART_CURVES)[number];

/**
 * How many token-valued series one render can resolve.
 *
 * `useThemeColor` is a hook, so it cannot be called in a loop over a series
 * list whose length changes. The root resolves a fixed number of slots instead
 * and pads the list to reach it. Eight is an opinion rather than a limit of the
 * technique — a categorical legend stops being readable well before eight — and
 * a chart that needs more can pass literal colours, which need no hook at all.
 */
export const CHART_MAX_TOKEN_SERIES = 8;

export const chartVariants = tv({
	slots: {
		root: "w-full",
		frame: "relative w-full overflow-hidden",
		legend: "flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-3",
		legendItem: "flex-row items-center gap-1.5",
		legendSwatch: "size-2.5 rounded-xs",
		legendLabel: "text-xs text-muted-foreground",
		tooltip: "absolute gap-1 rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-sm",
		tooltipHeading: "text-xs text-muted-foreground",
		tooltipRow: "flex-row items-center gap-1.5",
		tooltipSwatch: "size-2 rounded-xs",
		tooltipName: "text-xs text-muted-foreground",
		tooltipValue: "text-xs font-medium text-foreground",
	},
	variants: {
		size: {
			sm: { frame: "h-chart-sm" },
			md: { frame: "h-chart-md" },
			lg: { frame: "h-chart-lg" },
		},
	},
	defaultVariants: { size: "md" },
});

export type ChartVariantProps = { size?: ChartSize };

/** The ramp slot a series takes by position, cycling at five. */
export function chartSeriesToken(index: number): ChartSeriesToken {
	const position = Math.abs(Math.trunc(index)) % CHART_SERIES_TOKENS.length;
	return CHART_SERIES_TOKENS[position] as ChartSeriesToken;
}

/**
 * A shadcn-shaped config into an ordered series list, colour already decided.
 *
 * The config *is* the series list: its key order is the draw order and the
 * ramp order, so a caller reorders series by reordering the object. `yKeys`
 * narrows and reorders when a chart shows a subset.
 */
export function resolveChartSeries(config: ChartConfig, yKeys?: readonly string[]): ChartResolvedSeries[] {
	const keys = yKeys ?? Object.keys(config);
	return keys
		.filter((key) => config[key] !== undefined)
		.map((key, index) => {
			const entry = config[key];
			return {
				key,
				// An empty label falls back to the key rather than through: a blank
				// legend row is a swatch with nothing beside it, which reads as a
				// rendering fault rather than as the missing label it is.
				label: entry?.label === undefined || entry.label === "" ? key : entry.label,
				color: entry?.color ?? chartSeriesToken(index),
			};
		});
}

export type ChartColorPartition = {
	/** Exactly `max` token names, padded so the hook count never varies. */
	readonly tokens: readonly string[];
	/** Series whose colour is a literal, which needs no hook to resolve. */
	readonly literals: Readonly<Record<string, string>>;
};

/**
 * Splits the series into what a hook must resolve and what it need not.
 *
 * A literal (`#EC4899`) is already a colour, so it bypasses `useThemeColor`
 * entirely — which is why a twenty-series chart works as long as its colours
 * are literals. The token-valued remainder is padded to exactly `max` so the
 * number of hooks the root calls is constant across renders.
 *
 * Throws past the cap rather than truncating. A chart quietly drawing its ninth
 * series in the wrong colour is worse than one that says why.
 */
export function partitionChartColors(
	series: readonly ChartResolvedSeries[],
	max: number = CHART_MAX_TOKEN_SERIES
): ChartColorPartition {
	const tokens: string[] = [];
	const literals: Record<string, string> = {};

	for (const entry of series) {
		if (isLiteralColor(entry.color)) {
			literals[entry.key] = entry.color;
			continue;
		}
		tokens.push(entry.color);
	}

	if (tokens.length > max) {
		throw new Error(
			`[DelacourUI.Chart] ${tokens.length} series use theme tokens, and at most ${max} can be resolved in one render. ` +
				"Give the extra series literal colours, which need no lookup."
		);
	}

	while (tokens.length < max) tokens.push(CHART_SERIES_TOKENS[0] as string);

	return { tokens, literals };
}

/**
 * Reassembles resolved colours back onto the series, in the original order.
 *
 * `resolved` holds one entry per slot of `partitionChartColors`' token list, in
 * that order. A token that the active theme does not emit comes back
 * `undefined`, and the series keeps its token name — which renders as nothing
 * rather than as black, and is the honest outcome for a colour the theme has
 * no value for.
 */
export function applyChartColors(
	series: readonly ChartResolvedSeries[],
	partition: ChartColorPartition,
	resolved: readonly (string | undefined)[]
): ChartResolvedSeries[] {
	let slot = 0;
	return series.map((entry) => {
		const literal = partition.literals[entry.key];
		if (literal !== undefined) return { ...entry, color: literal };
		const value = resolved[slot];
		slot += 1;
		return { ...entry, color: value ?? entry.color };
	});
}

/**
 * Where a tooltip sits so it stays inside the frame.
 *
 * Flipped to the cursor's left near the right edge and clamped at both, so it
 * never leaves the chart — a tooltip half off-screen is worse than no tooltip,
 * because the value it exists to show is the part that gets cut.
 *
 * A worklet, so the tooltip tracks the finger on the UI thread. The directive
 * is a string rather than an import, which is what keeps this module free of
 * React Native and reachable from `bun test`.
 */
export function chartTooltipOffset(input: ChartTooltipInput): { x: number; y: number } {
	"worklet";
	const gap = input.gap ?? 12;
	const frameWidth = Number.isFinite(input.frameWidth) ? input.frameWidth : 0;
	const width = Number.isFinite(input.width) ? input.width : 0;
	const height = Number.isFinite(input.height) ? input.height : 0;

	const flipped = input.x + gap + width > frameWidth;
	const rawX = flipped ? input.x - gap - width : input.x + gap;
	const maxX = Math.max(0, frameWidth - width);
	const x = rawX < 0 ? 0 : rawX > maxX ? maxX : rawX;

	const frameHeight = Number.isFinite(input.frameHeight) ? input.frameHeight : 0;
	const maxY = Math.max(0, frameHeight - height);
	const rawY = input.y - height / 2;
	const y = rawY < 0 ? 0 : rawY > maxY ? maxY : rawY;

	return { x, y };
}

/** Axis label size in points, by chart size. */
export function chartAxisFontSize(size: ChartSize): number {
	switch (size) {
		case "sm":
			return 10;
		case "md":
			return 11;
		case "lg":
			return 12;
	}
}

/** How many ticks an axis aims for, by chart size. */
export function chartTickCount(size: ChartSize): number {
	switch (size) {
		case "sm":
			return 3;
		case "md":
			return 4;
		case "lg":
			return 5;
	}
}
