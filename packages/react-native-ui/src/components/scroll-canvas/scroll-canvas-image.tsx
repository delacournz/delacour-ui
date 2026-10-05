import type { ReactElement } from "react";
import type { ImageResizeMode, ImageSourcePropType } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { resolveParallax, resolveReveal, resolveZoom, scrollCanvasVariants } from "./scroll-canvas.variants";

export type ScrollCanvasImageProps = {
	effect: "parallax" | "zoom" | "reveal";
	source: ImageSourcePropType;
	progress: SharedValue<number>;
	frameHeight: SharedValue<number>;
	distance: number;
	resizeMode: ImageResizeMode;
	className?: string;
	coverClassName?: string;
};

/**
 * The single-picture effects: one animated image, plus a cover for `reveal`.
 *
 * Only `transform` moves — never a height or a top — so nothing re-lays out
 * mid-scroll. A parallax image's oversize is laid out once, in percent of the
 * frame (`resolveParallax` at a frame height of 100), so it needs no measured
 * height on the React side; only the drift reads the measured one. The cover is
 * drawn after the image so it sits on top, and slides up out of the clipped
 * frame rather than shrinking.
 */
export function ScrollCanvasImage({
	effect,
	source,
	progress,
	frameHeight,
	distance,
	resizeMode,
	className,
	coverClassName,
}: ScrollCanvasImageProps): ReactElement {
	const slots = scrollCanvasVariants();
	const percent = resolveParallax({ progress: 0, frameHeight: 100, distance });
	const layout =
		effect === "parallax"
			? { top: `${percent.imageTop}%` as const, height: `${percent.imageHeight}%` as const }
			: { top: 0, height: "100%" as const };

	const imageStyle = useAnimatedStyle(() => {
		if (effect === "parallax") {
			return {
				transform: [
					{
						translateY: resolveParallax({ progress: progress.value, frameHeight: frameHeight.value, distance })
							.translateY,
					},
				],
			};
		}
		if (effect === "zoom") {
			return { transform: [{ scale: resolveZoom({ progress: progress.value, distance }).scale }] };
		}
		return { transform: [] };
	});

	const coverStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateY: resolveReveal({ progress: progress.value, frameHeight: frameHeight.value }).coverTranslateY },
		],
	}));

	return (
		<>
			<Animated.Image
				className={slots.image({ className })}
				resizeMode={resizeMode}
				source={source}
				style={[layout, imageStyle]}
			/>
			{effect === "reveal" ? (
				<Animated.View className={slots.cover({ className: coverClassName })} style={coverStyle} />
			) : null}
		</>
	);
}
ScrollCanvasImage.displayName = "DelacourUI.ScrollCanvas.Image";
