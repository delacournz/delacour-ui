import { asNumber, candleSentiment, formatDateTick, formatNumberTick } from "@delacour/charts/core";
import { isLiteralColor } from "../../lib/color";
import { tv } from "../../lib/tv";
import type {
	ChartAreaSpec,
	ChartBarLayout,
	ChartBarSlot,
	ChartBarSpec,
	ChartCandleColors,
	ChartCandlestickKeys,
	ChartConfig,
	ChartDatum,
	ChartResolvedSeries,
	ChartTooltipInput,
	ChartTooltipRow,
} from "./chart.types";

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
 * How many *distinct* theme tokens one render can resolve.
 *
 * `useThemeColor` is a hook, so it cannot be called in a loop over a series
 * list whose length changes. The root resolves a fixed number of slots instead
 * and pads the list to reach it. Series sharing a token share a slot, so the
 * five-token ramp costs five slots however many series walk it. Eight is an
 * opinion rather than a limit of the technique — a categorical legend stops
 * being readable well before eight distinct colours — and a chart that needs
 * more can pass literal colours, which need no hook at all.
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
		pieCenter: "absolute inset-0 items-center justify-center",
		pieCenterValue: "text-2xl font-semibold text-foreground",
		pieCenterLabel: "text-xs text-muted-foreground",
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

/** A solid pie. Anything above zero is the hole of a donut. */
export const PIE_DEFAULT_INNER_RADIUS = 0;

/** A pie's rows, resolved: one series per drawn slice, index-aligned with its value. */
export type PieResolvedSeries = {
	/** One per kept row, in data order, colour decided but not yet resolved. */
	readonly series: ChartResolvedSeries[];
	/** The kept rows' values, in the same order. */
	readonly values: number[];
	readonly total: number;
};

/**
 * A pie's rows into an ordered series list, one per slice.
 *
 * The ramp walks the **data** rather than a config: a pie is a categorical
 * chart whose categories are rows, so the first row is `chart-1`, and a
 * `config` entry keyed by the row's name — `String(row[nameKey])`, the way a
 * legend would print it — overrides the label or the colour of that one row
 * without moving anyone else's ramp slot.
 *
 * A row whose value is negative, `NaN`, `null` or missing is dropped here,
 * before the engine sees it, so every list this returns lines up index for
 * index with the slices the engine draws and with the legend rows built from
 * it. A zero stays: it draws nothing, but its legend row still names it.
 *
 * Two rows sharing a name get distinct keys — the second becomes `a-1` — so
 * a legend keyed on them renders both rather than warning and dropping one.
 */
export function resolvePieSeries(
	data: readonly ChartDatum[],
	nameKey: string,
	valueKey: string,
	config: ChartConfig
): PieResolvedSeries {
	const series: ChartResolvedSeries[] = [];
	const values: number[] = [];
	const seen = new Map<string, number>();
	let total = 0;

	for (const row of data) {
		const value = asNumber(row[valueKey]);
		if (!Number.isFinite(value) || value < 0) continue;

		const index = series.length;
		const raw = row[nameKey];
		const name = raw === null || raw === undefined ? String(index) : String(raw);
		const count = seen.get(name) ?? 0;
		seen.set(name, count + 1);
		const entry = config[name];

		series.push({
			key: count === 0 ? name : `${name}-${count}`,
			label: entry?.label === undefined || entry.label === "" ? name : entry.label,
			color: entry?.color ?? chartSeriesToken(index),
		});
		values.push(value);
		total += value;
	}

	return { series, values, total };
}

/**
 * A slice's value as a readout prints it: digits grouped in threes.
 *
 * A pie's values are counts and totals — sessions, seats, revenue — and a
 * count reads as `1,240` in a readout beside a headline that says `1,125`.
 * The axis formatter is deliberately not used: a tick label sits in a column
 * where `1240` and `1,240` differ only in width, but a readout sits beside
 * `PieChart.Center`, and the two must print one number one way. Hand-rolled
 * rather than `toLocaleString` so it prints the same under `bun test` and
 * on a Hermes build with no Intl data.
 */
export function formatPieValue(value: number): string {
	if (!Number.isFinite(value)) return "";
	const plain = formatNumberTick(Math.abs(value));
	const [whole = "", fraction] = plain.split(".");
	const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const sign = value < 0 ? "-" : "";
	return fraction === undefined ? `${sign}${grouped}` : `${sign}${grouped}.${fraction}`;
}

/** A slice's share of the whole, in percent. Zero when there is no whole. */
export function pieSlicePercent(value: number, total: number): number {
	if (!(total > 0) || !Number.isFinite(value)) return 0;
	return (value / total) * 100;
}

/** What a slice label prints. A function receives the slice's label, value and fraction. */
export type PieLabelFormat = "percent" | "value" | "label" | ((slice: PieLabelSlice) => string);

/** The part of a slice a label can print. */
export type PieLabelSlice = {
	readonly label: string;
	readonly value: number;
	/** Share of the total, in `[0, 1]`. */
	readonly fraction: number;
};

/**
 * The text a slice label shows.
 *
 * A percentage by default, because a label on a slice answers "how much of
 * the whole" — the value and the name are the legend's and the tooltip's job.
 * Rounded to a whole number: `41.62%` on a wedge is more digits than the
 * wedge's width can justify.
 */
export function pieLabelText(format: PieLabelFormat | undefined, slice: PieLabelSlice): string {
	if (typeof format === "function") return format(slice);
	switch (format) {
		case "value":
			return formatNumberTick(slice.value);
		case "label":
			return slice.label;
		default:
			return `${Math.round(slice.fraction * 100)}%`;
	}
}

/**
 * A `0..1` fraction of the radius as the engine's percentage spec.
 *
 * A fraction rather than points because it reads the same at every chart
 * size: `0.6` is the same donut on a `sm` and a `lg` chart. Clamped, and a
 * non-number is no hole, which is what the engine does with one too.
 */
export function pieInnerRadiusSpec(fraction: number): `${number}%` {
	const clamped = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
	return `${Math.round(clamped * 100)}%`;
}

export type ChartColorPartition = {
	/** Exactly `max` token names, distinct, padded so the hook count never varies. */
	readonly tokens: readonly string[];
	/** Which slot of `tokens` each distinct token was resolved into. */
	readonly slotOf: Readonly<Record<string, number>>;
	/** Series whose colour is a literal, which needs no hook to resolve. */
	readonly literals: Readonly<Record<string, string>>;
};

/**
 * Splits the series into what a hook must resolve and what it need not.
 *
 * A literal (`#EC4899`) is already a colour, so it bypasses `useThemeColor`
 * entirely — which is why a twenty-series chart works as long as its colours
 * are literals. The token-valued remainder is collected as **distinct** tokens
 * in first-appearance order — a token is one lookup however many series wear
 * it, so the five-token ramp costs five slots for a twenty-slice pie — and
 * padded to exactly `max` so the number of hooks the root calls is constant
 * across renders.
 *
 * Throws past the cap rather than truncating. A chart quietly drawing its ninth
 * colour wrong is worse than one that says why.
 */
export function partitionChartColors(
	series: readonly ChartResolvedSeries[],
	max: number = CHART_MAX_TOKEN_SERIES
): ChartColorPartition {
	const tokens: string[] = [];
	const slotOf: Record<string, number> = {};
	const literals: Record<string, string> = {};

	for (const entry of series) {
		if (isLiteralColor(entry.color)) {
			literals[entry.key] = entry.color;
			continue;
		}
		if (slotOf[entry.color] !== undefined) continue;
		slotOf[entry.color] = tokens.length;
		tokens.push(entry.color);
	}

	if (tokens.length > max) {
		throw new Error(
			`[DelacourUI.Chart] ${tokens.length} distinct theme tokens are in use, and at most ${max} distinct tokens can be resolved in one render. ` +
				"Give the extra series literal colours, which need no lookup."
		);
	}

	while (tokens.length < max) tokens.push(CHART_SERIES_TOKENS[0] as string);

	return { tokens, slotOf, literals };
}

/**
 * Reassembles resolved colours back onto the series, in the original order.
 *
 * `resolved` holds one entry per slot of `partitionChartColors`' token list, in
 * that order; a series reads the slot its token was assigned, so two series on
 * one token read one value. A token that the active theme does not emit comes
 * back `undefined`, and the series keeps its token name — which renders as
 * nothing rather than as black, and is the honest outcome for a colour the
 * theme has no value for.
 */
export function applyChartColors(
	series: readonly ChartResolvedSeries[],
	partition: ChartColorPartition,
	resolved: readonly (string | undefined)[]
): ChartResolvedSeries[] {
	return series.map((entry) => {
		const literal = partition.literals[entry.key];
		if (literal !== undefined) return { ...entry, color: literal };
		const slot = partition.slotOf[entry.color];
		const value = slot === undefined ? undefined : resolved[slot];
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

/** How much of the series colour a lone area's fill starts with, before fading out. */
export const AREA_FILL_OPACITY = 0.25;

/** A stacked band's flat fill. Darker than a fade's top, because nothing under it shows through. */
export const AREA_STACKED_FILL_OPACITY = 0.65;

export type AreaFillInput = {
	readonly stacked: boolean;
	readonly gradient?: boolean;
	readonly opacity?: number;
};

export type AreaFill = {
	readonly gradient: boolean;
	readonly opacity: number;
};

/**
 * How an area is painted.
 *
 * A lone area fades to transparent towards the baseline: a flat fill at any
 * readable opacity competes with the line it sits under. A stacked band is
 * the opposite case. Three bands each fading over the full plot height blur
 * into one wash, and nothing says where one series ends and the next begins
 * — so a band is flat, at an opacity strong enough to read as a region. An
 * explicit `gradient` or `opacity` wins in either case.
 */
export function resolveAreaFill({ stacked, gradient, opacity }: AreaFillInput): AreaFill {
	return {
		gradient: gradient ?? !stacked,
		opacity: opacity ?? (stacked ? AREA_STACKED_FILL_OPACITY : AREA_FILL_OPACITY),
	};
}

/** Half a step each side, so an outermost bar, candle or dot sits inside the plot. */
export const EDGE_X_PADDING = 0.5;

/** A candle chart's y padding, as a fraction of the extent — room above the top wick and below the bottom one. */
export const CANDLE_Y_PADDING = 0.1;

export type DomainDefaultsInput = {
	readonly bars: ChartBarLayout;
	readonly candlestick: ChartCandlestickKeys | null;
	/** Whether any `Chart.Scatter` is placed. */
	readonly scatter: boolean;
	readonly includeZero?: boolean;
	readonly domain?: { readonly y?: readonly [number | undefined, number | undefined] };
};

export type DomainDefaults = {
	readonly includeZero: boolean | undefined;
	readonly domainPadding: { readonly x?: number; readonly y?: number } | undefined;
};

/**
 * What the marks ask of the domain, before the caller's own props.
 *
 * A bar stands on zero, so bars pull zero into y. A candle does not: prices in
 * the 140–160 band on an axis from zero are a thin strip, so a candle chart
 * keeps the data's own extent and pads it a tenth each way, which keeps the
 * top and bottom wicks off the plot's edges. An explicit y domain turns that
 * padding off — the caller has said where the axis ends. Bars, candles and
 * dots all pad x by half a step, because the outermost of each is centred on
 * the domain's end and would otherwise straddle the plot's edge.
 */
export function resolveDomainDefaults({
	bars,
	candlestick,
	scatter,
	includeZero,
	domain,
}: DomainDefaultsInput): DomainDefaults {
	const hasBars = bars.mode !== "none";
	const hasCandles = candlestick !== null;
	const x = hasBars || hasCandles || scatter ? EDGE_X_PADDING : undefined;
	const y = hasCandles && domain?.y === undefined ? CANDLE_Y_PADDING : undefined;
	const domainPadding = x === undefined ? undefined : y === undefined ? { x } : { x, y };
	return {
		includeZero: includeZero ?? (hasBars ? true : undefined),
		domainPadding,
	};
}

/** Past this many categories the labels collide, and dropping some is the lesser harm. */
export const CATEGORY_TICK_CAP = 12;

/**
 * How many ticks the category axis aims for.
 *
 * A bar's category name is that bar's label, so a bar chart asks for every
 * category rather than the size's tick budget: six months downsampled to
 * four ticks lose Feb and May, and a bar with nothing under it reads as a
 * bug rather than as a budget. Capped where the labels would collide, and
 * never below what the size would have asked for, so a two-bar chart on a
 * numeric axis is not left with two ticks.
 *
 * Only for a chart with bands — bars or candles. A line's x axis is a scale
 * and its ticks are a budget, as before.
 */
export function resolveCategoryTickCount(size: ChartSize, categoryCount: number, hasBands: boolean): number {
	const budget = chartTickCount(size);
	if (!hasBands) return budget;
	const every = Number.isFinite(categoryCount) ? Math.min(Math.trunc(categoryCount), CATEGORY_TICK_CAP) : 0;
	return Math.max(budget, every);
}

/** A span with no width still reads as a date, not as a clock time. */
const ONE_DAY_MS = 86_400_000;

/**
 * How a tooltip prints the x field of the row under the cursor.
 *
 * A `Date` is the case this exists for. `String(new Date())` is
 * `"Tue Jan 20 2026 00:00:00 GMT+0000"`, which is what a tooltip showed
 * before this: a full RFC timestamp beside a two-digit price, in a box sized
 * for neither.
 *
 * It formats through the **same** `formatDateTick` the axis uses, at the same
 * granularity, so the heading reads `20 Jan` directly above an axis reading
 * `18 Jan` — rather than two different renderings of one instant. The
 * granularity comes from the data's own span, so an intraday series gets a
 * clock and a multi-year one gets a year.
 *
 * A number goes through `formatNumberTick`, for the same reason an axis does:
 * `0.1 + 0.2` should not print as `0.30000000000000004`.
 */
export function resolveXValueFormat(data: readonly ChartDatum[], xKey: string): (row: ChartDatum) => string {
	let lo = Number.POSITIVE_INFINITY;
	let hi = Number.NEGATIVE_INFINITY;
	let sawDate = false;

	for (const row of data) {
		const value = row[xKey];
		if (!(value instanceof Date)) continue;
		const time = value.getTime();
		if (!Number.isFinite(time)) continue;
		sawDate = true;
		if (time < lo) lo = time;
		if (time > hi) hi = time;
	}

	if (!sawDate) {
		return (row) => {
			const value = row[xKey];
			if (typeof value === "number") return formatNumberTick(value);
			return value === null || value === undefined ? "" : String(value);
		};
	}

	// Only a *zero* span is substituted. Flooring every span at a day would
	// swallow a genuine intraday one and print `1 Jan` where the axis prints
	// `15:30`.
	const measured = hi - lo;
	const span = measured > 0 ? measured : ONE_DAY_MS;
	return (row) => {
		const value = row[xKey];
		return value instanceof Date ? formatDateTick(value.getTime(), span) : "";
	};
}

/** The one-stack rule, said the same way wherever it is broken. */
const ONE_STACK =
	"[DelacourUI.Chart] a chart holds one stack per chart. Every stacked mark has to share one stackId, and a stacked bar cannot sit beside a loose one.";

/**
 * Every `Chart.Bar` in a chart, into one arrangement.
 *
 * Bars group by being siblings and stack by sharing a `stackId`, which is
 * shadcn's surface — a call site writes `<Chart.Bar yKey="a" />` twice and
 * gets a grouped chart, adds `stackId="t"` to both and gets a stacked one.
 * The root has to see them all before any of them can know its width or its
 * base, so this runs on the root's child list rather than in the part.
 *
 * One stack per chart in this version: two `stackId`s, or a stack beside a
 * loose bar, throw by name rather than drawing something ambiguous. A key
 * placed twice throws too — the second bar would paint over the first.
 */
export function resolveBarLayout(specs: readonly ChartBarSpec[]): ChartBarLayout {
	if (specs.length === 0) return { mode: "none", keys: [], slotOf: {} };

	const keys: string[] = [];
	for (const spec of specs) {
		if (keys.includes(spec.yKey)) {
			throw new Error(`[DelacourUI.Chart] <Chart.Bar yKey="${spec.yKey}"> was placed twice. Each series is one bar.`);
		}
		keys.push(spec.yKey);
	}

	const stackIds = new Set(specs.map((spec) => spec.stackId));
	if (stackIds.size > 1) throw new Error(ONE_STACK);
	const stackId = specs[0]?.stackId;

	const slotOf: Record<string, ChartBarSlot> = {};
	if (stackId !== undefined) {
		keys.forEach((key, index) => {
			slotOf[key] = { groupIndex: 0, groupCount: 1, stackIndex: index };
		});
		return { mode: "stacked", keys, stackId, slotOf };
	}

	keys.forEach((key, index) => {
		slotOf[key] = { groupIndex: index, groupCount: keys.length };
	});
	return { mode: keys.length === 1 ? "single" : "grouped", keys, slotOf };
}

/**
 * Which areas stack, in placement order.
 *
 * The same one-stack rule as the bars, and it is one stack across both: the
 * engine's `stackKeys` is a single ordered list, so a chart cannot hold a bar
 * stack and an area stack at once. An area without a `stackId` beside a
 * stacked one is simply not in the stack — it draws to the baseline as
 * before, which is what an unstacked area always did.
 */
export function resolveStackedAreaKeys(areas: readonly ChartAreaSpec[], bars: ChartBarLayout): readonly string[] {
	const stacked = areas.filter((area) => area.stackId !== undefined);
	if (stacked.length === 0) return [];
	if (new Set(stacked.map((area) => area.stackId)).size > 1) throw new Error(ONE_STACK);
	if (bars.mode === "stacked") throw new Error(ONE_STACK);
	return stacked.map((area) => area.yKey);
}

/**
 * The keys the engine plots: every series, plus the candle fields.
 *
 * A candlestick's `config` is keyed by its close field alone — the legend and
 * the tooltip name one price, not four — so the other three fields have to
 * reach the engine some other way. Without duplicates, because the engine
 * builds one series per key and a repeated key would be two of them.
 */
export function resolveChartKeys(keys: readonly string[], candlestick: ChartCandlestickKeys | null): string[] {
	const resolved = [...keys];
	if (candlestick === null) return resolved;
	for (const key of [candlestick.open, candlestick.high, candlestick.low, candlestick.close]) {
		if (!resolved.includes(key)) resolved.push(key);
	}
	return resolved;
}

/**
 * The `rounded-*` step a bar's corners follow at each chart size.
 *
 * A bar is a filled block, and the step `Checkbox` picks for a filled block
 * of about the same width is the right one here: `xs` at the small size,
 * `sm` above it. Named so the multiplier below can be pinned to `tokens.css`.
 */
export const BAR_RADIUS_STEP: Record<ChartSize, "xs" | "sm"> = { sm: "xs", md: "sm", lg: "sm" };

/**
 * What each size multiplies `--radius` by, restating `tokens.css`.
 *
 * Restated because the corner scale is `@theme inline`: Tailwind substitutes
 * each step into its utilities and emits no `--radius-xs` variable, so
 * `--radius` is the only one that survives to runtime and anything computing
 * a corner in JavaScript multiplies for itself. `chart.variants.test.ts` pins
 * these against the file, so retuning the scale fails the build rather than
 * quietly leaving the bars on the old curve.
 */
export const BAR_RADIUS_MULTIPLIER: Record<ChartSize, number> = { sm: 0.4, md: 0.6, lg: 0.6 };

/**
 * A bar's corner radius in points.
 *
 * `--radius` × the size's multiplier by default, so a pasted theme that
 * squares its buttons squares its bars too. `rounded={false}` is square,
 * a number is exact, and nothing here goes below zero — a negative radius
 * would be handed to a path builder that clamps it anyway, but this is the
 * place that says so.
 */
export function resolveBarRadius(size: ChartSize, radius: number, rounded?: boolean | number): number {
	if (rounded === false) return 0;
	if (typeof rounded === "number") return Number.isFinite(rounded) ? Math.max(0, rounded) : 0;
	return Number.isFinite(radius) ? Math.max(0, radius * BAR_RADIUS_MULTIPLIER[size]) : 0;
}

/**
 * The tokens a candle takes for its sentiment.
 *
 * The first two slots of the series ramp, so a candlestick is painted from the
 * same five colours as every other chart and a pasted palette recolours it with
 * them. `success` and `destructive` were the first choice — they already mean
 * up and down elsewhere — but they made the one chart on a dashboard that
 * ignored the ramp, in red and green a theme never picked for its charts.
 * A flat candle is `muted-foreground`: it says nothing, in the colour of things
 * that say nothing. Only literal overrides are accepted on the part, so the
 * root can resolve these three with three fixed hook calls.
 */
export const CANDLE_SENTIMENT_TOKENS: ChartCandleColors = {
	positive: "chart-1",
	negative: "chart-2",
	neutral: "muted-foreground",
};

/** What the tooltip needs to know about a candlestick, once its colours are values. */
export type ChartTooltipCandle = {
	readonly keys: ChartCandlestickKeys;
	readonly colors: ChartCandleColors;
};

const CANDLE_FIELD_LABELS = ["Open", "High", "Low", "Close"] as const;

/**
 * The rows a tooltip prints for the row under the cursor.
 *
 * One per series, in draw order — unless a candlestick is present, in which
 * case the four price fields come first, labelled by name and swatched in
 * the candle's own sentiment colour, and a series that is one of those
 * fields is not printed again. Any other series, a volume line say, follows.
 */
export function resolveTooltipRows(
	series: readonly ChartResolvedSeries[],
	candlestick: ChartTooltipCandle | null,
	row: ChartDatum | undefined
): ChartTooltipRow[] {
	const readField = (key: string): unknown => (row === undefined ? undefined : row[key]);
	if (candlestick === null) {
		return series.map((entry) => ({
			key: entry.key,
			label: entry.label,
			color: entry.color,
			value: readField(entry.key),
		}));
	}

	const { keys, colors } = candlestick;
	const fields = [keys.open, keys.high, keys.low, keys.close];
	// `candleSentiment` treats a NaN as neutral, which is what a missing row is.
	const color = colors[candleSentiment(asNumber(readField(keys.open)), asNumber(readField(keys.close)))];

	const rows: ChartTooltipRow[] = fields.map((key, index) => ({
		key,
		label: CANDLE_FIELD_LABELS[index] as string,
		color,
		value: readField(key),
	}));

	for (const entry of series) {
		if (fields.includes(entry.key)) continue;
		rows.push({ key: entry.key, label: entry.label, color: entry.color, value: readField(entry.key) });
	}
	return rows;
}
