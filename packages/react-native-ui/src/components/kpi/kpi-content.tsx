import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { cardVariants } from "../card/card.variants";
import { KpiLayoutProvider, useKpiPart } from "./kpi.context";
import type { KpiSlotProps } from "./kpi.types";
import { type KpiLayout, kpiVariants } from "./kpi.variants";

export type KpiContentProps = KpiSlotProps & {
	/**
	 * `below` stacks the stat over a full-width sparkline. `inline` sets the
	 * sparkline in a fixed column beside the number, for a stack of cards whose
	 * shapes should line up down the right-hand edge.
	 */
	layout?: KpiLayout;
};

/**
 * The body: the stat and the sparkline. Sits on the card content's own inset,
 * and tells the stat and the sparkline inside it which layout they are in.
 */
export function KpiContent({ layout = "below", className, ...props }: KpiContentProps): ReactElement {
	const { size } = useKpiPart("Kpi.Content");
	return (
		<KpiLayoutProvider value={layout}>
			<View
				className={cardVariants({ size }).content({
					className: cn(kpiVariants({ layout, size }).content(), className),
				})}
				{...props}
			/>
		</KpiLayoutProvider>
	);
}
KpiContent.displayName = "DelacourUI.Kpi.Content";
