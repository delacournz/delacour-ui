import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { usePlannerPart } from "./planner.context";
import { countByCategory, plannerVariants, resolveEntryCount } from "./planner.variants";

export type PlannerSummaryProps = TextPresetProps;

/**
 * The displayed month's total as a line — "12 entries in October".
 *
 * Place it inside `Legend`, where it takes a row of its own under the
 * categories. Children replace the wording.
 */
export function PlannerSummary({ className, children, ...props }: PlannerSummaryProps): ReactElement {
	const { entries, month, categories, locale } = usePlannerPart("Planner.Summary");
	const { total } = countByCategory(entries, month, categories);
	const monthName = new Intl.DateTimeFormat(locale, { month: "long" }).format(month);

	return (
		<Text className={plannerVariants().summary({ className })} {...props}>
			{children ?? `${resolveEntryCount(total).replace(/^no/, "No")} in ${monthName}`}
		</Text>
	);
}
PlannerSummary.displayName = "DelacourUI.Planner.Summary";
