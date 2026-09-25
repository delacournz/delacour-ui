import type { ReactElement } from "react";
import { View } from "react-native";
import { useKpiPart } from "./kpi.context";
import type { KpiSlotProps } from "./kpi.types";
import { kpiVariants } from "./kpi.variants";

/** The header's trailing end — a menu button, a period filter, a link — pushed to the right edge. */
export function KpiAction({ className, ...props }: KpiSlotProps): ReactElement {
	const { size } = useKpiPart("Kpi.Action");
	return <View className={kpiVariants({ size }).action({ className })} {...props} />;
}
KpiAction.displayName = "DelacourUI.Kpi.Action";
