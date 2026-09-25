import { Children, type ReactElement, type ReactNode, useMemo } from "react";
import { View } from "react-native";
import { Separator } from "../separator";
import { Surface } from "../surface";
import { type KpiGroupContextValue, KpiGroupProvider } from "./kpi.context";
import type { KpiSlotProps } from "./kpi.types";
import { type KpiGroupOrientation, kpiVariants } from "./kpi.variants";

export type KpiGroupProps = KpiSlotProps & {
	/** `horizontal` splits the row between the metrics; `vertical` stacks them. */
	orientation?: KpiGroupOrientation;
	/**
	 * Set the metrics on one surface with a rule between them, rather than as
	 * separate cards spaced apart. Several metrics divided by a rule read as one
	 * panel; several spaced apart read as several panels that happen to be
	 * adjacent.
	 */
	separated?: boolean;
};

/** Puts a rule between adjacent children. `Separator` is hidden from assistive technology. */
function withRules(children: ReactNode, orientation: KpiGroupOrientation): ReactNode[] {
	const output: ReactNode[] = [];
	for (const [index, child] of Children.toArray(children).entries()) {
		if (index > 0) {
			output.push(
				<Separator key={`rule-${index}`} orientation={orientation === "horizontal" ? "vertical" : "horizontal"} />
			);
		}
		output.push(child);
	}
	return output;
}

/**
 * Several metrics as one arrangement, in a row or a column.
 *
 * Each `Kpi` inside reads the group: in a row it takes an equal share of the
 * width, and in a `separated` group it drops its own fill and hairline so the
 * group's one surface holds them all, a rule between each.
 */
export function KpiGroup({
	orientation = "vertical",
	separated = false,
	className,
	children,
	...props
}: KpiGroupProps): ReactElement {
	const context = useMemo<KpiGroupContextValue>(() => ({ orientation, separated }), [orientation, separated]);
	const slots = kpiVariants({ orientation, separated });

	if (separated) {
		return (
			<KpiGroupProvider value={context}>
				<Surface className={slots.group({ className })} padding="none" {...props}>
					{withRules(children, orientation)}
				</Surface>
			</KpiGroupProvider>
		);
	}

	return (
		<KpiGroupProvider value={context}>
			<View className={slots.group({ className })} {...props}>
				{children}
			</View>
		</KpiGroupProvider>
	);
}
KpiGroup.displayName = "DelacourUI.Kpi.Group";
