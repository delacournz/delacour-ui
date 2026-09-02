import type { ChartRow } from "@delacour/charts/core";

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
