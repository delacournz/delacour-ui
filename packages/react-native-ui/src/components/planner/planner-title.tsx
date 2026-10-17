import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { usePlannerPart } from "./planner.context";
import { plannerVariants } from "./planner.variants";
import { formatMonthTitle } from "./planner-dates";

export type PlannerTitleProps = TextPresetProps;

/**
 * The displayed month's name — "October 2026", in the planner's locale.
 *
 * A heading, so a screen reader can jump to it. Pass children to word it
 * yourself; `usePlanner().month` has the month. Under a `Scroller` it follows
 * the week at the top of the list.
 */
export function PlannerTitle({ className, children, ...props }: PlannerTitleProps): ReactElement {
	const { month, locale } = usePlannerPart("Planner.Title");
	return (
		<Text.Header
			accessibilityRole="header"
			className={plannerVariants().title({ className })}
			numberOfLines={1}
			{...props}
		>
			{children ?? formatMonthTitle(month, locale)}
		</Text.Header>
	);
}
PlannerTitle.displayName = "DelacourUI.Planner.Title";
