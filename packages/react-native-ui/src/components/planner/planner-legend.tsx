import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import { usePlannerPart } from "./planner.context";
import type { PlannerSlotProps } from "./planner.types";
import { countByCategory, plannerVariants, resolveCategoryColor } from "./planner.variants";

export type PlannerLegendProps = PlannerSlotProps & {
	/** Print each category's count for the displayed month beside its name. */
	counts?: boolean;
};

/**
 * Each category's colour and name — and, with `counts`, how many fall in the
 * displayed month — followed by any children, such as `Summary`.
 *
 * Every category is listed, a zero included, so the legend does not reflow as
 * the months page. Each row is one text element to a screen reader — "Run, 4"
 * — and its dot is hidden: the colour is the legend's point for the eye, and
 * the name is the whole of it for the ear.
 */
export function PlannerLegend({ counts = false, className, children, ...props }: PlannerLegendProps): ReactElement {
	const { entries, month, categories, isFramed } = usePlannerPart("Planner.Legend");
	const slots = plannerVariants({ isFramed });
	const { items } = countByCategory(entries, month, categories);

	return (
		<View className={slots.legend({ className })} {...props}>
			{items.map(({ category, count }) => {
				const color = resolveCategoryColor(category);
				return (
					<View
						accessibilityLabel={counts ? `${category.label}, ${count}` : category.label}
						accessible
						className={slots.legendItem()}
						key={category.id}
					>
						<View
							className={cn(
								slots.legendDot(),
								color.kind === "chart" ? plannerVariants({ colorIndex: color.index }).swatch() : undefined,
								color.kind === "default" ? "bg-primary" : undefined
							)}
							style={color.kind === "literal" ? { backgroundColor: color.color } : undefined}
						/>
						<Text className={slots.legendLabel()}>{category.label}</Text>
						{counts ? <Text className={slots.legendCount()}>{count}</Text> : null}
					</View>
				);
			})}
			{children}
		</View>
	);
}
PlannerLegend.displayName = "DelacourUI.Planner.Legend";
