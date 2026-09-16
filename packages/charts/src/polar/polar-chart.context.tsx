import { createContext, useContext } from "react";
import type { PolarContextValue } from "./polar-chart.types";

/**
 * The resolved polar chart, published to its children.
 *
 * Rendered **inside** the Skia canvas, for the reason `CartesianChartContext`
 * documents: context resolves by which reconciler renders the provider node,
 * so a provider among the canvas' children is visible to the Skia marks below
 * it and one above the canvas is not.
 */
export const PolarChartContext = createContext<PolarContextValue | null>(null);

PolarChartContext.displayName = "DelacourCharts.PolarChartContext";

/**
 * The chart a pie mark is drawn in.
 *
 * Throws outside one rather than returning `null`: a mark that silently draws
 * nothing is a blank canvas with no error, and a Skia tree has no element
 * inspector to look at.
 */
export function usePolarContext(): PolarContextValue {
	const value = useContext(PolarChartContext);
	if (value === null) {
		throw new Error(
			"[@delacour/charts] a pie mark was rendered outside a <PolarChart>. " +
				"Marks read the chart from context, so they have to be its children."
		);
	}
	return value;
}

/** The chart, or `null` outside one. For a part that is legitimately optional. */
export function useOptionalPolarContext(): PolarContextValue | null {
	return useContext(PolarChartContext);
}
