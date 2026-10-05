import type { ReactElement, ReactNode } from "react";
import type { ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Text } from "../text";
import { useStackCardPart } from "./stack-card.context";
import {
	resolveStampOpacity,
	STACK_CARD_STAMP_ROTATION,
	type StackCardDirection,
	type StackCardStampColor,
	stackCardVariants,
} from "./stack-card.variants";

export type StackCardStampProps = Omit<ViewProps, "children" | "style"> & {
	/** The direction this stamp answers for. Defaults to `right`. */
	direction?: StackCardDirection;
	/** The stamp's colour — and the tint of the action button for the same direction. */
	color?: StackCardStampColor;
	/** The stamp's word. Bare text is wrapped in the stamp's label. */
	children: ReactNode;
	className?: string;
	labelClassName?: string;
};

/**
 * The answer a throw gives, printed on the top card as it is dragged.
 *
 * Declared once on the deck and drawn on whichever card is on top, on the side
 * it answers for — a right-hand "yes" sits top-start, tilted the way a rubber
 * stamp lands. It fades in with progress toward its direction and reaches full
 * strength at the threshold, so a stamp at full strength means "let go and this
 * is the answer". Hidden from assistive technology: the card's actions say the
 * same thing in words.
 */
export function StackCardStamp({
	direction = "right",
	color = "primary",
	children,
	className,
	labelClassName,
	...props
}: StackCardStampProps): ReactElement {
	const { x, y, width, height, threshold } = useStackCardPart("StackCard.Stamp");
	const rotation = STACK_CARD_STAMP_ROTATION[direction];
	const slots = stackCardVariants({ color, direction });

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: resolveStampOpacity({
			direction,
			height: height.value,
			threshold,
			width: width.value,
			x: x.value,
			y: y.value,
		}),
		transform: [{ rotate: `${rotation}deg` }],
	}));

	return (
		<Animated.View
			accessibilityElementsHidden
			className={slots.stamp({ className })}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={animatedStyle}
			{...props}
		>
			{typeof children === "string" || typeof children === "number" ? (
				<Text className={slots.stampLabel({ className: labelClassName })}>{children}</Text>
			) : (
				children
			)}
		</Animated.View>
	);
}
StackCardStamp.displayName = "DelacourUI.StackCard.Stamp";
