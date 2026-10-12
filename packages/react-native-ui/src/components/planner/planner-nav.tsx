import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { IconChevronLeft, IconChevronRight } from "../../icons/central";
import { Button } from "../button";
import { Icon } from "../icon";
import { usePlannerPart } from "./planner.context";
import { plannerVariants } from "./planner.variants";

export type PlannerNavProps = ViewProps & {
	className?: string;
	/** Spoken for the back button. Defaults to "Previous month". */
	previousLabel?: string;
	/** Spoken for the forward button. Defaults to "Next month". */
	nextLabel?: string;
};

/**
 * The previous- and next-month buttons.
 *
 * Each pages one month and slides the grid that way; the new month is
 * announced to a screen reader once it has actually arrived, so a controlled
 * parent that refuses the change is not reported as having made it.
 */
export function PlannerNav({
	className,
	previousLabel = "Previous month",
	nextLabel = "Next month",
	testID,
	...props
}: PlannerNavProps): ReactElement {
	const { page } = usePlannerPart("Planner.Nav");
	return (
		<View className={plannerVariants().nav({ className })} testID={testID} {...props}>
			<Button
				accessibilityLabel={previousLabel}
				onPress={() => page(-1)}
				size="icon-sm"
				testID={testID === undefined ? undefined : `${testID}-previous`}
				variant="ghost"
			>
				<Icon icon={IconChevronLeft} />
			</Button>
			<Button
				accessibilityLabel={nextLabel}
				onPress={() => page(1)}
				size="icon-sm"
				testID={testID === undefined ? undefined : `${testID}-next`}
				variant="ghost"
			>
				<Icon icon={IconChevronRight} />
			</Button>
		</View>
	);
}
PlannerNav.displayName = "DelacourUI.Planner.Nav";
