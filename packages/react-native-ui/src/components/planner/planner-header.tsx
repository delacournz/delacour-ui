import type { ReactElement } from "react";
import { View } from "react-native";
import { usePlannerPart } from "./planner.context";
import type { PlannerSlotProps } from "./planner.types";
import { plannerVariants } from "./planner.variants";

/**
 * The top row: the month's name, with `Today`, `Nav` and any `Action` after it.
 *
 * The title takes the spare width, so the controls sit at the end in the order
 * they are written. On a framed planner it takes the card's inset.
 */
export function PlannerHeader({ className, ...props }: PlannerSlotProps): ReactElement {
	const { isFramed } = usePlannerPart("Planner.Header");
	return <View className={plannerVariants({ isFramed }).header({ className })} {...props} />;
}
PlannerHeader.displayName = "DelacourUI.Planner.Header";
