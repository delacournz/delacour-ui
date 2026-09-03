import { createContext, useContext } from "react";
import type { ChartContextValue } from "./cartesian-chart.types";

/**
 * The resolved chart, published to its children.
 *
 * The provider is rendered **inside** the Skia canvas. That is what makes this
 * work at all: `<Canvas>` mounts a second React reconciler, so a provider
 * placed above it is invisible to Skia children below it. Context resolves by
 * which reconciler renders the *provider node*, not by where the context
 * object was created — so mounting the provider as a child of the canvas puts
 * it in the Skia tree and consumers below resolve it normally.
 *
 * It is exported rather than hidden behind its hook because a consumer that
 * wants its own context inside the canvas needs to do exactly the same thing,
 * and needs something to copy.
 */
export const CartesianChartContext = createContext<ChartContextValue | null>(null);

CartesianChartContext.displayName = "DelacourCharts.CartesianChartContext";

/**
 * The chart a mark is drawn in.
 *
 * Throws outside a chart rather than returning `null`. A mark that silently
 * renders nothing is a blank canvas with no error, which is among the hardest
 * things to diagnose in a Skia tree — there is no element inspector to look at.
 */
export function useChartContext(): ChartContextValue {
	const value = useContext(CartesianChartContext);
	if (value === null) {
		throw new Error(
			"[delacour-react-native-charts] a chart mark was rendered outside a <CartesianChart>. " +
				"Marks read the chart from context, so they have to be its children."
		);
	}
	return value;
}

/** The chart, or `null` outside one. For a part that is legitimately optional. */
export function useOptionalChartContext(): ChartContextValue | null {
	return useContext(CartesianChartContext);
}
