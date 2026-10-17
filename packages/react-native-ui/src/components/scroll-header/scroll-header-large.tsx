import { type ReactElement, type ReactNode, useCallback, useLayoutEffect } from "react";
import type { LayoutChangeEvent, ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useScrollHeaderPart } from "./scroll-header.context";
import { resolveLargeOpacity, scrollHeaderVariants } from "./scroll-header.variants";

export type ScrollHeaderLargeProps = ViewProps & {
	children?: ReactNode;
	className?: string;
};

/**
 * The large title block, sitting under the bar and scrolling away with the content while it
 * fades out — the open half of the crossfade.
 *
 * **It is measured, not sized.** Its height is the collapse distance, so larger Dynamic Type
 * or a second line simply lengthens the travel; `onLayout` re-derives it whenever it changes.
 *
 * **It takes no touches** (`pointerEvents="none"`). It floats over the scroller rather than
 * inside it, and on iOS a drag that starts on a view outside a scroll view never reaches that
 * scroll view's pan — a drag on the title would not scroll. So the block is display-only:
 * title, subtitle, a count. A control belongs in the bar, or at the top of the content.
 *
 * Hidden from assistive technology once collapsed, when the bar title has taken over.
 */
export function ScrollHeaderLarge({
	className,
	children,
	onLayout,
	style,
	...props
}: ScrollHeaderLargeProps): ReactElement {
	const { source, progress, safeAreaTop, barHeight, largeHeight, isCollapsed, registerLarge } =
		useScrollHeaderPart("ScrollHeader.Large");
	const { offset } = source;

	useLayoutEffect(() => registerLarge(), [registerLarge]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			onLayout?.(event);
			largeHeight.value = event.nativeEvent.layout.height;
		},
		[onLayout, largeHeight]
	);

	const animatedStyle = useAnimatedStyle(() => ({
		top: safeAreaTop + barHeight.value,
		opacity: resolveLargeOpacity(progress.value),
		transform: [{ translateY: -offset.value }],
	}));

	return (
		<Animated.View
			accessibilityElementsHidden={isCollapsed}
			className={scrollHeaderVariants().large({ className })}
			importantForAccessibility={isCollapsed ? "no-hide-descendants" : "auto"}
			onLayout={handleLayout}
			pointerEvents="none"
			style={[style, animatedStyle]}
			{...props}
		>
			{children}
		</Animated.View>
	);
}
ScrollHeaderLarge.displayName = "DelacourUI.ScrollHeader.Large";
