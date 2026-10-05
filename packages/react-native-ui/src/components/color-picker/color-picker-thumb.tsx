import { type ReactElement, useCallback } from "react";
import { type LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle, useDerivedValue, withSpring } from "react-native-reanimated";
import { hsvToRgb } from "./color-picker.color";
import { useColorPickerPart } from "./color-picker.context";
import { COLOR_PICKER_THUMB_ANIMATION, COLOR_PICKER_THUMB_SPRING, colorPickerVariants } from "./color-picker.variants";
import { ColorPickerCheckerboard } from "./color-picker-checkerboard";

export type ColorPickerThumbProps = {
	/** The thumb's centre along x, in its parent's frame. */
	x: SharedValue<number>;
	/** The thumb's centre along y. Omitted on a track, which centres it with `justify-center`. */
	y?: SharedValue<number>;
	/** Written with the thumb's measured diameter, which the parent's geometry needs. */
	size: SharedValue<number>;
	/** The parent's measured extent. The thumb stays invisible while it is `0`. */
	extent: SharedValue<number>;
	isGrabbed: SharedValue<boolean>;
	/** Also told the measured diameter, for a parent that needs it in React state. */
	onSize?: (size: number) => void;
	/**
	 * What the interior shows: the whole current colour opaque, the bare hue, or
	 * the colour at its alpha over a checkerboard.
	 */
	tint: "color" | "hue" | "alpha";
	className?: string;
};

/**
 * The ring every drag surface positions — internal, not a public part.
 *
 * **One animated style on the ring carries the position and the grab scale**,
 * as two entries in one `transform`: two animated styles on one node fight for
 * the prop and the later silently wins. The scale is a `useDerivedValue`, so its
 * spring is evaluated when the grab changes rather than every frame of the drag.
 *
 * The interior is a second node with its own animated `backgroundColor`, read
 * from the live model on the UI thread, so the thumb shows the colour under the
 * finger without React rendering once.
 *
 * Invisible until the parent has been measured — before that it sits at a
 * garbage offset for a frame, which reads as a flicker on mount.
 */
export function ColorPickerThumb({
	x,
	y,
	size,
	extent,
	isGrabbed,
	onSize,
	tint,
	className,
}: ColorPickerThumbProps): ReactElement {
	const { live, size: step } = useColorPickerPart("ColorPicker.Thumb");
	const slots = colorPickerVariants({ size: step });

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			size.value = event.nativeEvent.layout.width;
			onSize?.(event.nativeEvent.layout.width);
		},
		[onSize, size]
	);

	const scale = useDerivedValue(() =>
		withSpring(
			isGrabbed.value ? COLOR_PICKER_THUMB_ANIMATION.grabbedScale : COLOR_PICKER_THUMB_ANIMATION.restScale,
			COLOR_PICKER_THUMB_SPRING
		)
	);

	const ringStyle = useAnimatedStyle(() => {
		const half = size.value / 2;
		return {
			opacity: extent.value > 0 ? 1 : 0,
			transform: [{ translateX: x.value - half }, { translateY: y ? y.value - half : 0 }, { scale: scale.value }],
		};
	});

	const colorStyle = useAnimatedStyle(() => {
		const model = live.value;
		const { r, g, b } = hsvToRgb(tint === "hue" ? { h: model.h, s: 1, v: 1, a: 1 } : model);
		return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${tint === "alpha" ? model.a : 1})` };
	});

	return (
		<Animated.View
			className={slots.thumb({ className })}
			onLayout={handleLayout}
			pointerEvents="none"
			style={ringStyle}
		>
			<Animated.View className={slots.thumbInner()}>
				{tint === "alpha" ? <ColorPickerCheckerboard /> : null}
				<Animated.View style={[StyleSheet.absoluteFill, colorStyle]} />
			</Animated.View>
		</Animated.View>
	);
}
ColorPickerThumb.displayName = "DelacourUI.ColorPicker.Thumb";
