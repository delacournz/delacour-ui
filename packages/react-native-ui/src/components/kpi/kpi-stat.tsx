import type { ReactElement } from "react";
import { View } from "react-native";
import { useKpiLayout, useKpiPart } from "./kpi.context";
import type { KpiSlotProps } from "./kpi.types";
import { kpiVariants } from "./kpi.variants";

/**
 * The value and its change, stacked tight.
 *
 * Its own container rather than loose children of the content, because the
 * number and its change are one fact in two lines and the card's spacing is
 * for the gaps *between* facts. Beside an `inline` sparkline it takes the
 * row's width, leaving the chart its column on the end.
 */
export function KpiStat({ className, ...props }: KpiSlotProps): ReactElement {
	const { size } = useKpiPart("Kpi.Stat");
	const layout = useKpiLayout();
	return <View className={kpiVariants({ layout, size }).stat({ className })} {...props} />;
}
KpiStat.displayName = "DelacourUI.Kpi.Stat";
