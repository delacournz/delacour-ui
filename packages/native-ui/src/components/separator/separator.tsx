import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { type SeparatorOrientation, separatorVariants } from "./separator.variants";

export type SeparatorProps = ViewProps & {
	/** Axis the line runs along. A vertical separator needs a parent with a height. */
	orientation?: SeparatorOrientation;
	className?: string;
};

/**
 * A one-pixel rule dividing content.
 *
 * Hidden from assistive technology: the line carries no information a screen
 * reader can use, and announcing one between every row of a list would bury the
 * rows themselves.
 *
 * `ListGroup` inserts these between its rows automatically, so this is written
 * out by hand only for a divider elsewhere — or to place one inside a
 * `ListGroup` deliberately, which suppresses the automatic one at that point.
 *
 * @example
 * <Separator className="my-4" />
 *
 * @example
 * <View className="flex-row items-center gap-3">
 *   <Text>Left</Text>
 *   <Separator className="h-4" orientation="vertical" />
 *   <Text>Right</Text>
 * </View>
 */
export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps): ReactElement {
	return (
		<View
			accessibilityElementsHidden
			accessible={false}
			className={separatorVariants({ className, orientation })}
			importantForAccessibility="no-hide-descendants"
			{...props}
		/>
	);
}
