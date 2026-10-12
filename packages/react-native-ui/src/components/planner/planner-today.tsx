import type { ReactElement } from "react";
import { Button, type ButtonProps } from "../button";
import { usePlannerPart } from "./planner.context";
import { isCurrentMonth } from "./planner.variants";

export type PlannerTodayProps = Omit<ButtonProps, "onPress"> & { onPress?: () => void };

/**
 * Back to the month holding today.
 *
 * Disabled while that month is the one shown — a control that does nothing
 * when pressed should say so before it is. A small outline button reading
 * "Today" unless given children; `onPress` runs after the planner has moved.
 */
export function PlannerToday({ children, onPress, isDisabled, ...props }: PlannerTodayProps): ReactElement {
	const { month, today, goToToday } = usePlannerPart("Planner.Today");
	return (
		<Button
			isDisabled={isDisabled ?? isCurrentMonth(month, today)}
			onPress={() => {
				goToToday();
				onPress?.();
			}}
			size="sm"
			variant="outline"
			{...props}
		>
			{children ?? <Button.Label>Today</Button.Label>}
		</Button>
	);
}
PlannerToday.displayName = "DelacourUI.Planner.Today";
