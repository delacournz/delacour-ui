import { useMemo } from "react";
import { useThemeColor } from "../../hooks/use-theme-color";
import type { ChartResolvedSeries } from "./chart.types";
import { applyChartColors, CHART_MAX_TOKEN_SERIES, partitionChartColors } from "./chart.variants";

/**
 * Resolves a series list's theme tokens into colour strings.
 *
 * Every theme lookup happens here, above the canvas. Skia's renderer is a
 * second React reconciler with no Uniwind provider in it, so a hook called
 * inside would resolve nothing — the marks receive resolved strings instead.
 * A hook rather than a helper in a root so `Chart` and `PieChart` share one
 * palette and one cap.
 *
 * Eight calls, written out. `partitionChartColors` pads its token list to
 * exactly this many so the hook count cannot vary between renders, and a loop
 * over the series would break the rules of hooks the moment a series was
 * added. The repetition is the mechanism, not an oversight. Tokens are
 * deduped first, so the eight are eight *distinct* tokens — the five-token
 * ramp costs five, however many series walk it.
 */
export function useChartPalette(declared: readonly ChartResolvedSeries[]): ChartResolvedSeries[] {
	const partition = useMemo(() => partitionChartColors(declared, CHART_MAX_TOKEN_SERIES), [declared]);

	const color0 = useThemeColor(partition.tokens[0] as string);
	const color1 = useThemeColor(partition.tokens[1] as string);
	const color2 = useThemeColor(partition.tokens[2] as string);
	const color3 = useThemeColor(partition.tokens[3] as string);
	const color4 = useThemeColor(partition.tokens[4] as string);
	const color5 = useThemeColor(partition.tokens[5] as string);
	const color6 = useThemeColor(partition.tokens[6] as string);
	const color7 = useThemeColor(partition.tokens[7] as string);

	return useMemo(
		() => applyChartColors(declared, partition, [color0, color1, color2, color3, color4, color5, color6, color7]),
		[declared, partition, color0, color1, color2, color3, color4, color5, color6, color7]
	);
}
