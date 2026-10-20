import type { ReactElement } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useComparePart } from "./compare.context";
import type { CompareLayerProps } from "./compare.types";
import { compareVariants, resolveCoveredLayer, resolveRevealTransforms } from "./compare.variants";

/**
 * The front layer, revealed by a mask that slides rather than a box that shrinks.
 *
 * **Two nodes, two transforms, and no layout.** The mask is a full-frame clip
 * translated `-(1 - p) × size` along the axis; the content inside it is
 * translated back by exactly as much. The content is therefore laid out once, at
 * the frame's size, and never re-measured — animating a width instead would
 * squash an image and reflow text on every frame, and the two halves would fall
 * out of register. `resolveRevealTransforms` is the one place both numbers come
 * from, and a test holds them equal and opposite.
 *
 * Two animated styles on two nodes rather than one: the mask and its content
 * move in opposite directions, and two `useAnimatedStyle`s on one view fight for
 * `transform`.
 *
 * **Invisible until the frame is measured.** Before `onLayout` the size is `0`,
 * every offset is zero, and Before would cover the frame for a frame — a flicker
 * on every mount.
 */
export function CompareBefore({ className, children, testID }: CompareLayerProps): ReactElement {
	const { position, frameSize, orientation, isRtl, current } = useComparePart("Compare.Before");
	const isVertical = orientation === "vertical";
	const slots = compareVariants();
	const isCovered = resolveCoveredLayer(current) === "before";

	const maskStyle = useAnimatedStyle(() => {
		const size = frameSize.value;
		const { maskOffset } = resolveRevealTransforms(position.value, size, orientation, isRtl);
		return {
			opacity: size > 0 ? 1 : 0,
			transform: isVertical ? [{ translateY: maskOffset }] : [{ translateX: maskOffset }],
		};
	});

	const innerStyle = useAnimatedStyle(() => {
		const { innerOffset } = resolveRevealTransforms(position.value, frameSize.value, orientation, isRtl);
		return { transform: isVertical ? [{ translateY: innerOffset }] : [{ translateX: innerOffset }] };
	});

	return (
		<Animated.View
			accessibilityElementsHidden={isCovered}
			className={slots.mask()}
			importantForAccessibility={isCovered ? "no-hide-descendants" : "auto"}
			style={maskStyle}
			testID={testID}
		>
			<Animated.View className={slots.inner({ className })} style={innerStyle}>
				{children}
			</Animated.View>
		</Animated.View>
	);
}
CompareBefore.displayName = "DelacourUI.Compare.Before";
