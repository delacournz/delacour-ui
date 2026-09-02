import type { ChartScrubState } from "@delacour/charts";
import { createContext, type ReactNode, useContext } from "react";
import type { ChartDatum, ChartResolvedSeries } from "./chart.types";
import type { ChartSize, chartVariants } from "./chart.variants";

export type ChartSlots = ReturnType<typeof chartVariants>;

export type ChartContextValue = {
	/** Series in draw order, colours already resolved to values. */
	readonly series: readonly ChartResolvedSeries[];
	readonly data: readonly ChartDatum[];
	readonly xKey: string;
	/** Prints a row's x field — a Date as a date, not as an RFC timestamp. */
	readonly formatXValue: (row: ChartDatum) => string;
	readonly size: ChartSize;
	readonly slots: ChartSlots;
	/** Resolved gridline colour, or `undefined` if the theme emits none. */
	readonly gridColor: string | undefined;
	/** Resolved axis-label colour. */
	readonly axisColor: string | undefined;
	/**
	 * The surface the chart is drawn on.
	 *
	 * A cursor dot rings itself in this so it reads as a knob sitting on the
	 * line rather than as a slight thickening of it.
	 */
	readonly surfaceColor: string | undefined;
	readonly scrub: ChartScrubState;
	/** The frame's measured size, for placing an overlay inside it. */
	readonly frame: { readonly width: number; readonly height: number };
};

/**
 * The resolved chart, published twice from one value.
 *
 * Twice because the chart straddles a reconciler boundary. Skia's `<Canvas>`
 * runs its own React renderer and context does not cross into it, so the root
 * renders one provider around the React Native subtree — the legend and the
 * tooltip — and a second one *inside* the canvas around the marks. Same object,
 * two provider elements, no bridge and no extra dependency.
 *
 * The context is exported rather than hidden behind its hook because that
 * second mounting is unusual enough to want something to copy.
 */
export const ChartContext = createContext<ChartContextValue | null>(null);

ChartContext.displayName = "DelacourUI.ChartContext";

export function ChartProvider({
	value,
	children,
}: {
	readonly value: ChartContextValue;
	readonly children: ReactNode;
}): ReactNode {
	return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
}

ChartProvider.displayName = "DelacourUI.ChartProvider";

/**
 * The chart a part belongs to.
 *
 * Throws outside one. A Skia mark that silently rendered nothing would leave a
 * blank canvas with no error and no element inspector to look at, which is
 * among the hardest things to diagnose in this package.
 */
export function useChart(): ChartContextValue {
	const value = useContext(ChartContext);
	if (value === null) {
		throw new Error("[DelacourUI] a Chart part was used outside a <Chart>. Every part reads the chart from context.");
	}
	return value;
}

/** The chart, or `null` outside one. */
export function useChartContext(): ChartContextValue | null {
	return useContext(ChartContext);
}

/** One series' resolved colour, or `undefined` when the key names no series. */
export function useSeriesColor(key: string | undefined): string | undefined {
	const { series } = useChart();
	if (key === undefined) return undefined;
	return series.find((entry) => entry.key === key)?.color;
}
