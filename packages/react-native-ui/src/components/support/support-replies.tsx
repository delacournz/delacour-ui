import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { ScrollView, type ViewProps } from "react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import { supportVariants } from "./support.variants";

/** How far each reply's entrance trails the one before it. */
const STAGGER_MS = 40;

export type SupportRepliesProps = ViewProps & {
	/** `Support.Reply` chips. */
	children: ReactNode;
	className?: string;
};

/**
 * Suggested answers, as a row of chips that scrolls sideways — meant to sit just above the
 * composer, so it rides up with the keyboard.
 *
 * Each reply fades up on first mount with a small stagger, and only then; under reduce motion the
 * entrance is skipped (`ReduceMotion.System`). Taps on a chip land while the keyboard is open.
 */
export function SupportReplies({ className, children, ...props }: SupportRepliesProps): ReactElement {
	const slots = supportVariants();
	const items = Children.toArray(children);

	return (
		<ScrollView
			contentContainerClassName={slots.replies({ className })}
			horizontal
			keyboardShouldPersistTaps="handled"
			showsHorizontalScrollIndicator={false}
			{...props}
		>
			{items.map((child, index) => (
				<Animated.View
					entering={FadeInDown.delay(index * STAGGER_MS).reduceMotion(ReduceMotion.System)}
					key={isValidElement(child) && child.key !== null ? child.key : index}
				>
					{child}
				</Animated.View>
			))}
		</ScrollView>
	);
}
SupportReplies.displayName = "DelacourUI.Support.Replies";
