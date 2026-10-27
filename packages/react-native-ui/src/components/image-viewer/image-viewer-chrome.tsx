import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Text } from "../text";
import { imageViewerVariants, resolveBackdropOpacity, VIEWER_ZOOMED_THRESHOLD } from "./image-viewer.variants";
import { ImageViewerClose } from "./image-viewer-close";

export type ImageViewerChromeProps = {
	index: number;
	count: number;
	caption?: string;
	/** Whether a single tap has hidden it. Read on the JS side too, so a hidden close cannot be tapped. */
	isVisible: boolean;
	insets: { top: number; bottom: number };
	windowHeight: number;
	fade: SharedValue<number>;
	progress: SharedValue<number>;
	chrome: SharedValue<number>;
	scale: SharedValue<number>;
	dismissY: SharedValue<number>;
};

/**
 * Close and counter across the top, the caption across the foot, all in
 * `media-foreground` on the stage.
 *
 * It fades with the flight, with the drag away, with a single tap, and out as
 * the image zooms past {@link VIEWER_ZOOMED_THRESHOLD} — detail is what the user
 * zoomed for, and chrome over it is in the way.
 */
export function ImageViewerChrome({
	index,
	count,
	caption,
	isVisible,
	insets,
	windowHeight,
	fade,
	progress,
	chrome,
	scale,
	dismissY,
}: ImageViewerChromeProps): ReactElement {
	const slots = imageViewerVariants();

	const animatedStyle = useAnimatedStyle(() => {
		const zoom = (scale.value - 1) / (VIEWER_ZOOMED_THRESHOLD - 1);
		const zoomFade = 1 - (zoom < 0 ? 0 : zoom > 1 ? 1 : zoom);
		const flight = progress.value < 0 ? 0 : progress.value > 1 ? 1 : progress.value;
		return {
			opacity: fade.value * flight * chrome.value * zoomFade * resolveBackdropOpacity(dismissY.value, windowHeight),
		};
	});

	const pointerEvents = isVisible ? "box-none" : "none";

	return (
		<Animated.View
			pointerEvents={pointerEvents}
			style={[{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }, animatedStyle]}
		>
			<View className={slots.chrome()} pointerEvents={pointerEvents} style={{ paddingTop: insets.top + 4 }}>
				<ImageViewerClose />
				{count > 1 ? (
					<Text className={slots.counter()} testID="image-viewer-counter">
						{`${index + 1} / ${count}`}
					</Text>
				) : null}
			</View>
			{caption ? (
				<View className={slots.captionFrame()} pointerEvents="none" style={{ paddingBottom: insets.bottom + 16 }}>
					<Text className={slots.caption()}>{caption}</Text>
				</View>
			) : null}
		</Animated.View>
	);
}
ImageViewerChrome.displayName = "DelacourUI.ImageViewer.Chrome";
