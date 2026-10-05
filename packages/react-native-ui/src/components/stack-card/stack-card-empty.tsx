import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "../text";
import { stackCardVariants } from "./stack-card.variants";

export type StackCardEmptyProps = ViewProps & {
	className?: string;
};

/**
 * What the pile shows once every card has gone — centred where the cards were.
 *
 * Rendered by the deck only while its index has reached the card count, so an
 * `EmptyState` or a refill button goes here rather than behind the cards. Bare
 * text is wrapped in a muted paragraph.
 */
export function StackCardEmpty({ className, children, ...props }: StackCardEmptyProps): ReactElement {
	return (
		<View className={stackCardVariants().empty({ className })} {...props}>
			{typeof children === "string" ? (
				<Text align="center" color="muted" variant="paragraph">
					{children}
				</Text>
			) : (
				children
			)}
		</View>
	);
}
StackCardEmpty.displayName = "DelacourUI.StackCard.Empty";
