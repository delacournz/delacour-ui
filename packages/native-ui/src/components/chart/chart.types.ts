import type { ChartRow, Sentiment } from "delacour-react-native-charts/core";

/** One series' name and colour. */
export type ChartSeriesConfig = {
	/** Shown in the legend and the tooltip. */
	label: string;
	/**
	 * A theme token (`chart-3`, `primary`) or a literal (`#EC4899`).
	 *
	 * Defaults to this series' position on the ramp, so the first series in the
	 * config is `chart-1` and nothing has to be named at all.
	 */
	color?: string;
};

/**
 * The chart's series, keyed by the data field each reads.
 *
 * Key order is draw order and ramp order both, so reordering the object
 * reorders the chart. This is shadcn's shape deliberately — a config written
 * for a web dashboard moves across as a copy rather than a translation.
 */
export type ChartConfig = Record<string, ChartSeriesConfig>;

/** A series after its colour has been decided and resolved. */
export type ChartResolvedSeries = {
	readonly key: string;
	readonly label: string;
	/** A colour value by the time a mark sees it, never a token name. */
	readonly color: string;
};

/** A row of the caller's data. */
export type ChartDatum = ChartRow;

/** What `chartTooltipOffset` needs to place a tooltip inside its frame. */
export type ChartTooltipInput = {
	/** The cursor, in frame coordinates. */
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
	readonly frameWidth: number;
	readonly frameHeight: number;
	/** Space between the cursor and the tooltip. Defaults to 12. */
	readonly gap?: number;
};

/** What one `Chart.Bar` declares about where it stands, before any bar is laid out. */
export type ChartBarSpec = {
	readonly yKey: string;
	/** Bars sharing a stack id stack on one another; bars without one group side by side. */
	readonly stackId?: string;
};

export type ChartBarLayoutMode = "none" | "single" | "grouped" | "stacked";

/** Where one bar series sits in the layout. */
export type ChartBarSlot = {
	/** Its position among the side-by-side bars of one step. Zero in a stack. */
	readonly groupIndex: number;
	/** How many bars share one step. One in a stack. */
	readonly groupCount: number;
	/** Its position from the bottom of the stack. Absent unless stacked. */
	readonly stackIndex?: number;
};

/**
 * Every `Chart.Bar` in the chart, resolved into one arrangement.
 *
 * Bars group by being siblings and stack by sharing a `stackId`, so the root
 * has to see them all before any of them can know its width or its base. One
 * stack per chart: the layout is either all stacked or all side by side.
 */
export type ChartBarLayout = {
	readonly mode: ChartBarLayoutMode;
	/** The bar series, in the order they were placed — bottom first for a stack. */
	readonly keys: readonly string[];
	readonly stackId?: string;
	readonly slotOf: Readonly<Record<string, ChartBarSlot>>;
};

/** The four fields a candlestick reads from each row. */
export type ChartCandlestickKeys = {
	readonly open: string;
	readonly high: string;
	readonly low: string;
	readonly close: string;
};

/** One resolved colour per candle sentiment. */
export type ChartCandleColors = Readonly<Record<Sentiment, string>>;

/** What one `Chart.Area` declares about stacking. */
export type ChartAreaSpec = {
	readonly yKey: string;
	readonly stackId?: string;
};

/** One line of the tooltip's readout. */
export type ChartTooltipRow = {
	readonly key: string;
	readonly label: string;
	/** Resolved, or `undefined` when the theme emits nothing for it. */
	readonly color: string | undefined;
	/** The row's value as written, for the caller's formatter. */
	readonly value: unknown;
};
