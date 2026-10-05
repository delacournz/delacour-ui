import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import { usePlannerPart } from "./planner.context";
import { plannerVariants } from "./planner.variants";
import { weekdayLabels } from "./planner-dates";

/**
 * The row of weekday names over the grid and the scroller, in the planner's
 * locale and week start.
 *
 * Hidden from assistive technology: every day's own label already says its
 * weekday, and seven bare "Mon … Sun" stops in front of the month would be
 * read before anything useful.
 */
export function PlannerWeekdays({ className }: { className?: string }): ReactElement {
	const { locale, weekStartsOn, isFramed } = usePlannerPart("Planner.Weekdays");
	const slots = plannerVariants({ isFramed });
	return (
		<View
			accessibilityElementsHidden
			className={cn(slots.weekdays(), className)}
			importantForAccessibility="no-hide-descendants"
		>
			{weekdayLabels(locale, weekStartsOn).map((label) => (
				<Text className={slots.weekday()} key={label.long} numberOfLines={1}>
					{label.short}
				</Text>
			))}
		</View>
	);
}
PlannerWeekdays.displayName = "DelacourUI.Planner.Weekdays";
