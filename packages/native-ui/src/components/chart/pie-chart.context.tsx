import type { PieSliceData } from "@delacour/charts/core";
import { createContext, type ReactNode, useContext } from "react";
import type { ChartSlots } from "./chart.context";
import type { ChartResolvedSeries } from "./chart.types";
import type { ChartSize } from "./chart.variants";

export type PieChartContextValue = {
	/** One per drawn slice, in data order, colours already resolved to values. */
	readonly series: readonly ChartResolvedSeries[];
	/** The slices' values, index-aligned with `series`. */
	readonly values: readonly number[];
	readonly total: number;
	/**
	 * The slices' geometry, index-aligned with `series`.
	 *
	 * Resolved here as well as in the engine, from the same pure functions on
	 * the same frame, because the tooltip is a React Native view outside the
	 * canvas and the engine's context does not reach it.
	 */
	readonly slices: readonly PieSliceData[];
	readonly slots: ChartSlots;
	readonly size: ChartSize;
	/** The surface under the pie — what the hairline between slices is painted in. */
	readonly surfaceColor: string | undefined;
	/** The frame's measured size, for placing an overlay inside it. */
	readonly frame: { readonly width: number; readonly height: number };
	readonly nameKey: string;
	readonly valueKey: string;
	/** The hole, as a fraction of the radius. `0` is a pie. */
	readonly innerRadius: number;
	/** The slice singled out by a tap or by the caller, or `null`. */
	readonly selectedIndex: number | null;
	/** Selects a slice by index, or clears the selection with `null`. */
	readonly select: (index: number | null) => void;
};

/**
 * The resolved pie, published twice from one value — once around the React
 * Native subtree and once inside the canvas — for the reason `ChartContext`
 * documents: Skia's renderer is its own reconciler and context does not cross
 * into it.
 */
export const PieChartContext = createContext<PieChartContextValue | null>(null);

PieChartContext.displayName = "DelacourUI.PieChartContext";

export function PieChartProvider({
	value,
	children,
}: {
	readonly value: PieChartContextValue;
	readonly children: ReactNode;
}): ReactNode {
	return <PieChartContext.Provider value={value}>{children}</PieChartContext.Provider>;
}

PieChartProvider.displayName = "DelacourUI.PieChartProvider";

/**
 * The pie a part belongs to. Throws outside one, for the reason `useChart`
 * does: a mark that silently drew nothing would be a blank canvas with no
 * error to read.
 */
export function usePieChart(): PieChartContextValue {
	const value = useContext(PieChartContext);
	if (value === null) {
		throw new Error(
			"[DelacourUI] a PieChart part was used outside a <PieChart>. Every part reads the chart from context."
		);
	}
	return value;
}

/** The pie, or `null` outside one. */
export function usePieChartContext(): PieChartContextValue | null {
	return useContext(PieChartContext);
}
