import { type ReactElement, type ReactNode, useMemo } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { StackCardSlotProvider, useStackCardPart } from "./stack-card.context";
import { resolveBehindTransform, resolveDragProgress } from "./stack-card.variants";

export type StackCardSlotProps = {
	/** This card's index in the deck. */
	cardIndex: number;
	/** Whether this card is the top one, as React last rendered it. */
	isTop: boolean;
	/** The points the pile keeps clear below the cards, for the stack's step. */
	inset: number;
	children: ReactNode;
};

/**
 * The animated box one card sits in. Internal — the deck renders one per
 * mounted card.
 *
 * **Every slot reads the same two shared values**, the top card's `x` and `y`,
 * and works out its own place from how far behind the UI thread's top it sits:
 *
 * - the top follows the drag, tilting `x / width · 12°`;
 * - a card behind sits at `resolveBehindTransform`, interpolated toward the slot
 *   ahead by the drag's progress, so it is already in place when a release
 *   throws the top card;
 * - a card ahead of the top — the one just thrown, kept mounted for undo — is
 *   hidden.
 *
 * Nothing here re-renders during a drag, and the top moving is a shared value
 * changing, so a throw lands without waiting on React. Under reduced motion the
 * cards behind do not step during the drag: the pile swaps when the throw lands.
 *
 * Every transform pivots on the bottom centre, which is what makes `fan` fan,
 * and makes a smaller `stack` card's lower edge peek out below the one in front.
 * Only the top card takes touches or is visible to assistive technology.
 */
export function StackCardSlot({ cardIndex, isTop, inset, children }: StackCardSlotProps): ReactElement {
	const { x, y, top, fade, width, height, threshold, layout, depth, isReducedMotion } =
		useStackCardPart("StackCard.Card");

	const animatedStyle = useAnimatedStyle(() => {
		const position = cardIndex - top.value;
		if (position < 0) {
			return {
				opacity: 0,
				transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }, { rotate: "0deg" }],
			};
		}
		if (position === 0) {
			const rotate = width.value > 0 ? (x.value / width.value) * 12 : 0;
			return {
				opacity: fade.value,
				transform: [{ translateX: x.value }, { translateY: y.value }, { scale: 1 }, { rotate: `${rotate}deg` }],
			};
		}
		const progress = isReducedMotion
			? 0
			: resolveDragProgress({ height: height.value, threshold, width: width.value, x: x.value, y: y.value });
		const behind = resolveBehindTransform({ depth, layout, position, progress });
		return {
			opacity: behind.opacity,
			transform: [
				{ translateX: 0 },
				{ translateY: behind.translateY },
				{ scale: behind.scale },
				{ rotate: `${behind.rotate}deg` },
			],
		};
	});

	const slot = useMemo(() => ({ cardIndex, isTop }), [cardIndex, isTop]);

	return (
		<StackCardSlotProvider value={slot}>
			<Animated.View
				accessibilityElementsHidden={!isTop}
				importantForAccessibility={isTop ? "auto" : "no-hide-descendants"}
				pointerEvents={isTop ? "box-none" : "none"}
				style={[
					{ bottom: inset, left: 0, position: "absolute", right: 0, top: 0, transformOrigin: "50% 100%" },
					animatedStyle,
				]}
			>
				{children}
			</Animated.View>
		</StackCardSlotProvider>
	);
}
StackCardSlot.displayName = "DelacourUI.StackCard.Slot";
