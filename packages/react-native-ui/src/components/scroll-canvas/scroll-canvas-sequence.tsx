import type { ReactElement } from "react";
import type { ImageResizeMode, ImageSourcePropType } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle, useDerivedValue } from "react-native-reanimated";
import {
	resolveSequenceIndex,
	SCROLL_CANVAS_SEQUENCE_WARN_FRAMES,
	scrollCanvasVariants,
} from "./scroll-canvas.variants";

export type ScrollCanvasSequenceProps = {
	sources: readonly ImageSourcePropType[];
	progress: SharedValue<number>;
	resizeMode: ImageResizeMode;
	className?: string;
};

/**
 * A frame sequence scrubbed by the scroll: every frame is mounted, stacked, and
 * exactly one is opaque — the one `resolveSequenceIndex` picks.
 *
 * **Mounting them all is the point.** Swapping one image's `source` on each
 * index change would decode on the JS thread and flash the placeholder between
 * frames; opacity toggled on the UI thread snaps. The cost is memory, which is
 * why more than {@link SCROLL_CANVAS_SEQUENCE_WARN_FRAMES} frames warns in
 * development. No cross-fade: a scrub should land on a frame, not between two.
 */
export function ScrollCanvasSequence({
	sources,
	progress,
	resizeMode,
	className,
}: ScrollCanvasSequenceProps): ReactElement {
	const count = sources.length;
	const current = useDerivedValue(() => resolveSequenceIndex(progress.value, count));

	if (process.env.NODE_ENV !== "production" && count > SCROLL_CANVAS_SEQUENCE_WARN_FRAMES) {
		console.warn(
			`ScrollCanvas: a sequence of ${count} frames mounts every one at once. Keep it to ${SCROLL_CANVAS_SEQUENCE_WARN_FRAMES} or fewer, at display size.`
		);
	}

	// Frames are positional and never reorder, so the index is their identity.
	return (
		<>
			{sources.map((source, index) => (
				<ScrollCanvasSequenceFrame
					className={className}
					current={current}
					index={index}
					key={`frame-${index.toString()}`}
					resizeMode={resizeMode}
					source={source}
				/>
			))}
		</>
	);
}
ScrollCanvasSequence.displayName = "DelacourUI.ScrollCanvas.Sequence";

type ScrollCanvasSequenceFrameProps = {
	source: ImageSourcePropType;
	index: number;
	current: SharedValue<number>;
	resizeMode: ImageResizeMode;
	className?: string;
};

/**
 * One frame of a sequence, opaque only while it is the current one.
 * `fadeDuration={0}` stops Android's decode fade-in, which would otherwise show
 * as a flicker the first time each frame is scrubbed to.
 */
function ScrollCanvasSequenceFrame({
	source,
	index,
	current,
	resizeMode,
	className,
}: ScrollCanvasSequenceFrameProps): ReactElement {
	const slots = scrollCanvasVariants();
	const style = useAnimatedStyle(() => ({ opacity: current.value === index ? 1 : 0 }));

	return (
		<Animated.Image
			className={slots.image({ className })}
			fadeDuration={0}
			resizeMode={resizeMode}
			source={source}
			style={[FULL_HEIGHT, style]}
		/>
	);
}
ScrollCanvasSequenceFrame.displayName = "DelacourUI.ScrollCanvas.Sequence.Frame";

const FULL_HEIGHT = { top: 0, height: "100%" } as const;
