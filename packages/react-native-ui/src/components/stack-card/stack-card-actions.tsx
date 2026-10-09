import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { stackCardVariants } from "./stack-card.variants";

export type StackCardActionsProps = ViewProps & {
	className?: string;
};

/**
 * A centred row of `StackCard.Action` buttons under the pile.
 *
 * Wherever it is written among the deck's children, the deck renders it below
 * the pile, which takes the height left over.
 */
export function StackCardActions({ className, ...props }: StackCardActionsProps): ReactElement {
	return <View className={stackCardVariants().actions({ className })} {...props} />;
}
StackCardActions.displayName = "DelacourUI.StackCard.Actions";
