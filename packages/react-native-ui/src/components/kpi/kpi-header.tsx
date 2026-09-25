import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { cardVariants } from "../card/card.variants";
import { useKpiPart } from "./kpi.context";
import type { KpiSlotProps } from "./kpi.types";
import { kpiVariants } from "./kpi.variants";

/**
 * The top row: a tinted icon, the metric's name, and anything acting on it.
 *
 * Sits on the card header's own inset — the classes are the card's, with the
 * row centred rather than top-aligned — so the title lines up with the number
 * and the footer below it at every size.
 */
export function KpiHeader({ className, ...props }: KpiSlotProps): ReactElement {
	const { size } = useKpiPart("Kpi.Header");
	return (
		<View
			className={cardVariants({ size }).header({ className: cn(kpiVariants({ size }).header(), className) })}
			{...props}
		/>
	);
}
KpiHeader.displayName = "DelacourUI.Kpi.Header";
