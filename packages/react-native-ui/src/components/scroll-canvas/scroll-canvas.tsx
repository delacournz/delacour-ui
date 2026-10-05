import { type ReactElement, useCallback } from "react";
import type { LayoutChangeEvent } from "react-native";
import Animated from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import type { ScrollCanvasProps } from "./scroll-canvas.types";
import {
	resolveCanvasAccessibility,
	SCROLL_CANVAS_DEFAULT_ASPECT,
	SCROLL_CANVAS_DEFAULT_DISTANCE,
	scrollCanvasVariants,
} from "./scroll-canvas.variants";
import { ScrollCanvasImage } from "./scroll-canvas-image";
import { ScrollCanvasSequence } from "./scroll-canvas-sequence";
import { useFrameProgress } from "./use-frame-progress";

/**
 * An image in a frame that stays put while the picture moves inside it as the
 * page scrolls. The frame is the layout; only what is inside it moves.
 *
 * | `effect` | What moves |
 * | --- | --- |
 * | `parallax` | the image drifts against the scroll inside the still frame |
 * | `zoom` | the image settles from oversized to natural as the frame enters |
 * | `reveal` | a cover retreats upward, uncovering the image from the bottom edge |
 * | `sequence` | the scroll position picks which of N frames is showing |
 *
 * It follows a scroll source rather than wrapping a scrollable: inside a
 * `<Screen>` it needs no wiring, but must then be a **direct child** of the
 * scroll content, because a Screen's source has no scroller ref to measure
 * against. Anywhere else pass the `source` from `useScrollSource()` — then it is
 * measured with `measureLayout` and may sit at any depth — or drive it with
 * `progress`.
 *
 * Under Reduce Motion (or `DelacourProvider`'s `isMotionCalm`, or
 * `enabled={false}`) every effect draws its resting state: a picture moving
 * independently of the finger is a vestibular trigger.
 *
 * @example
 * const { source, scrollProps } = useScrollSource();
 *
 * <Animated.ScrollView {...scrollProps}>
 *   <ScrollCanvas accessibilityLabel="Fog over a ridge" scrollSource={source} source={ridge} />
 *   <ScrollCanvas effect="sequence" scrollSource={source} sources={spinFrames} />
 * </Animated.ScrollView>
 */
export function ScrollCanvas({
	effect = "parallax",
	source,
	sources,
	coverClassName,
	aspectRatio = SCROLL_CANVAS_DEFAULT_ASPECT,
	distance = SCROLL_CANVAS_DEFAULT_DISTANCE,
	start,
	end,
	progress,
	scrollSource,
	enabled = true,
	accessibilityLabel,
	resizeMode = "cover",
	className,
	imageClassName,
	style,
	onLayout,
	...props
}: ScrollCanvasProps): ReactElement {
	const isCalm = useCalmMotion();
	const frame = useFrameProgress({ effect, start, end, progress, scrollSource, isStill: isCalm || !enabled });
	const slots = scrollCanvasVariants();
	const accessibility = resolveCanvasAccessibility(accessibilityLabel);

	const frameOnLayout = frame.onLayout;
	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			frameOnLayout(event);
			onLayout?.(event);
		},
		[frameOnLayout, onLayout]
	);

	return (
		<Animated.View
			className={slots.frame({ className })}
			onLayout={handleLayout}
			ref={frame.frameRef}
			style={[{ aspectRatio }, style]}
			{...accessibility}
			{...props}
		>
			{effect === "sequence" ? (
				<ScrollCanvasSequence
					className={imageClassName}
					progress={frame.progress}
					resizeMode={resizeMode}
					sources={sources ?? []}
				/>
			) : source !== undefined ? (
				<ScrollCanvasImage
					className={imageClassName}
					coverClassName={coverClassName}
					distance={distance}
					effect={effect}
					frameHeight={frame.frameHeight}
					progress={frame.progress}
					resizeMode={resizeMode}
					source={source}
				/>
			) : null}
		</Animated.View>
	);
}
ScrollCanvas.displayName = "DelacourUI.ScrollCanvas";
