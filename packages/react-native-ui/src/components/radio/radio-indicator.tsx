import { type ComponentProps, type ReactElement, type ReactNode, useEffect } from "react";
import { View, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useRadioPart } from "./radio.context";
import { RADIO_DOT_SPRING, radioVariants } from "./radio.variants";

export type RadioIndicatorChildrenProps = {
	isSelected: boolean;
	isInvalid: boolean;
	size: "lg" | "md" | "sm";
	variant: "primary" | "secondary";
};
export type RadioIndicatorProps = Omit<ViewProps, "children"> & {
	className?: string;
	/** Replaces the dot. The ring, its size and its colours are still the radio's. */
	children?: ReactNode | ((props: RadioIndicatorChildrenProps) => ReactNode);
	/** Props for the dot's own `Animated.View`, for a caller restyling it in place. */
	dotProps?: Omit<ComponentProps<typeof Animated.View>, "children" | "className"> & { className?: string };
};

/**
 * The circle: a ring, and the dot that scales into it when the radio is selected.
 *
 * Composed in automatically as the radio's first child, so write it out by hand
 * only to move it — a trailing indicator is `<Radio.Indicator />` placed last —
 * or to replace the dot with children of your own.
 *
 * **Drawn from `View`s rather than a Central Icon.** Rule 5 governs icons, and
 * `Spinner`'s arc is the precedent for primitives; here the set has no
 * ring-with-a-centred-dot glyph at all. Two things follow from drawing it: the
 * dot can scale from the ring's centre entirely on the UI thread, and the ring's
 * four themed colours stay classes in `radio.variants.ts` where `bun test`
 * reaches them. An `Icon` would take its colour as a resolved value, splitting
 * one decision across two mechanisms.
 *
 * **The animated style lives on the dot, never on the ring.** `Pressable`'s root
 * `Animated.View` already owns `opacity` and `transform` through a
 * `useAnimatedStyle` of its own, and two animated styles on one node fight for
 * the same props. The dot is a descendant two levels down, so the two never
 * contend — which is also why `Radio` takes no `asChild`.
 *
 * **Reduce motion is left at Reanimated's default `System`, deliberately the
 * opposite call to `Spinner`'s `ReduceMotion.Never`.** The spinner needs `Never`
 * because a zero-length animation inside `withRepeat(-1)` would spin forever.
 * Here the state is carried by the dot's *presence*, not by its motion, so
 * `System` snapping straight to the target is exactly the right degradation.
 */
export function RadioIndicator({ className, children, dotProps, ...props }: RadioIndicatorProps): ReactElement {
	const { size, variant, isSelected, isInvalid } = useRadioPart("Radio.Indicator");
	// Seeded from the current state rather than from zero, so a group that mounts
	// with a selection does not animate every dot in on its first paint.
	const progress = useSharedValue(isSelected ? 1 : 0);

	useEffect(() => {
		progress.value = withSpring(isSelected ? 1 : 0, RADIO_DOT_SPRING);
	}, [isSelected, progress]);

	// Both branches animate: the outgoing dot shrinks rather than vanishing, which
	// is what makes a group read as one selection moving between rows.
	const dotStyle = useAnimatedStyle(() => ({
		opacity: progress.value,
		transform: [{ scale: progress.value }],
	}));

	const slots = radioVariants({ isInvalid, isSelected, size, variant });

	const renderChildren = () => {
		if (typeof children === "function") {
			return children({ isSelected, isInvalid, size, variant });
		}

		if (children) {
			return children;
		}

		return null;
	};

	return (
		<View className={slots.indicator({ className })} {...props}>
			{renderChildren() ?? (
				<Animated.View
					{...dotProps}
					className={slots.dot({ className: dotProps?.className })}
					style={[dotStyle, dotProps?.style]}
				/>
			)}
		</View>
	);
}
RadioIndicator.displayName = "DelacourUI.Radio.Indicator";
