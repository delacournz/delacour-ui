import type { ReactElement } from "react";
import { View } from "react-native";
import { usePlannerPart } from "./planner.context";
import type { PlannerSlotProps } from "./planner.types";
import { plannerVariants } from "./planner.variants";

/** The last row — a link, a button, a caveat — inset to match the header. */
export function PlannerFooter({ className, ...props }: PlannerSlotProps): ReactElement {
	const { isFramed } = usePlannerPart("Planner.Footer");
	return <View className={plannerVariants({ isFramed }).footer({ className })} {...props} />;
}
PlannerFooter.displayName = "DelacourUI.Planner.Footer";
