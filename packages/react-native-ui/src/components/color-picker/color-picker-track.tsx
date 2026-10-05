import { type ReactElement, useCallback, useMemo, useState } from "react";
import { type AccessibilityActionEvent, type LayoutChangeEvent, StyleSheet, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useFieldContext } from "../field/field.context";
import { playHaptic } from "../pressable";
import { hsvToRgb, stepHsva, trackToValue, valueToTrack } from "./color-picker.color";
import { useColorPickerPart } from "./color-picker.context";
import {
	COLOR_PICKER_HUE_STEP,
	COLOR_PICKER_STEP,
	colorPickerVariants,
	describeAlphaValue,
	describeHueValue,
	resolveColorPickerLabel,
	resolveTrackInset,
} from "./color-picker.variants";
import { ColorPickerCheckerboard } from "./color-picker-checkerboard";
import { ColorPickerHueGradient } from "./color-picker-gradient";
import { ColorPickerThumb } from "./color-picker-thumb";

export type ColorPickerTrackProps = Omit<ViewProps, "children" | "style"> & {
	/** The name a screen reader reads. Defaults to the channel's name, prefixed by the `Field.Label`. */
	accessibilityLabel?: string;
	className?: string;
};

/** The two channels a track can drive, and everything that differs between them. */
const CHANNELS = {
	hue: { max: 360, step: COLOR_PICKER_HUE_STEP, part: "Hue", channel: "hue" },
	alpha: { max: 1, step: COLOR_PICKER_STEP, part: "Opacity", channel: "alpha" },
} as const;

/**
 * A horizontal track that drives one channel — internal; `ColorPicker.Hue` and
 * `ColorPicker.Alpha` are this with the channel named.
 *
 * Slider's geometry: the thumb's centre travels the track less one thumb, so the
 * handle stays inside the groove at both ends, and the touch is read in the
 * thumb's own frame. The touch area is padded on the cross axis only, so the
 * pan's `x` is the track's `x` with no gutter to correct for.
 *
 * The surface never re-renders during a drag. The hue track's rainbow is
 * static; the alpha track is the current colour as an animated view under a
 * static checkerboard that fades out along the track — see
 * `color-picker-checkerboard.tsx`. Only the settled geometry, measured once,
 * reaches React state, because the gradient's inset has to be a prop.
 */
export function ColorPickerTrack({
	channel: channelName,
	accessibilityLabel,
	className,
	testID,
	...props
}: ColorPickerTrackProps & { channel: keyof typeof CHANNELS }): ReactElement {
	const {
		live,
		hsva,
		size,
		isDisabled,
		isReadOnly,
		haptic,
		hasChangeListener,
		beginDrag,
		dragChange,
		endDrag,
		setHsva,
	} = useColorPickerPart(channelName === "hue" ? "ColorPicker.Hue" : "ColorPicker.Alpha");
	const field = useFieldContext();
	const slots = colorPickerVariants({ size, isDisabled });
	const spec = CHANNELS[channelName];
	const isHue = channelName === "hue";

	const width = useSharedValue(0);
	const thumbSize = useSharedValue(0);
	const isGrabbed = useSharedValue(false);
	// The gradient's inset is a prop, so the two lengths it is made of reach React
	// state as well as the shared values — once each, on layout, never in a drag.
	const [geometry, setGeometry] = useState({ track: 0, thumb: 0 });
	const inset = resolveTrackInset(geometry.track, geometry.thumb);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const measured = event.nativeEvent.layout.width;
			width.value = measured;
			setGeometry((current) => ({ ...current, track: measured }));
		},
		[width]
	);

	const handleThumbSize = useCallback((thumb: number) => {
		setGeometry((current) => ({ ...current, thumb }));
	}, []);

	const gesture = useMemo(() => {
		const applyTouch = (x: number) => {
			"worklet";
			const thumb = thumbSize.value;
			const value = trackToValue(x - thumb / 2, width.value - thumb, spec.max);
			const next = isHue ? { ...live.value, h: value } : { ...live.value, a: value };
			live.value = next;
			if (hasChangeListener) scheduleOnRN(dragChange, next);
		};

		return Gesture.Pan()
			.enabled(!isDisabled && !isReadOnly)
			.minDistance(0)
			.shouldCancelWhenOutside(false)
			.onBegin((event) => {
				"worklet";
				isGrabbed.value = true;
				scheduleOnRN(beginDrag);
				if (haptic !== false) playHaptic(haptic);
				applyTouch(event.x);
			})
			.onUpdate((event) => {
				"worklet";
				applyTouch(event.x);
			})
			.onFinalize(() => {
				"worklet";
				isGrabbed.value = false;
				if (haptic !== false) playHaptic("light");
				scheduleOnRN(endDrag, live.value);
			});
	}, [
		beginDrag,
		dragChange,
		endDrag,
		haptic,
		hasChangeListener,
		isDisabled,
		isGrabbed,
		isHue,
		isReadOnly,
		live,
		spec.max,
		thumbSize,
		width,
	]);

	const x = useDerivedValue(() => {
		const thumb = thumbSize.value;
		const value = isHue ? live.value.h : live.value.a;
		return thumb / 2 + valueToTrack(value, width.value - thumb, spec.max);
	});

	const colorStyle = useAnimatedStyle(() => {
		const { r, g, b } = hsvToRgb({ ...live.value, a: 1 });
		return { backgroundColor: `rgb(${r}, ${g}, ${b})` };
	});

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (isDisabled || isReadOnly) return;
			const direction = event.nativeEvent.actionName === "increment" ? 1 : -1;
			setHsva(stepHsva(hsva, spec.channel, direction, spec.step), { commit: true });
		},
		[hsva, isDisabled, isReadOnly, setHsva, spec.channel, spec.step]
	);

	const now = isHue ? Math.round(hsva.h) % 360 : Math.round(hsva.a * 100);

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				accessibilityActions={ACCESSIBILITY_ACTIONS}
				accessibilityLabel={resolveColorPickerLabel({
					label: field?.label,
					override: accessibilityLabel,
					part: spec.part,
				})}
				accessibilityRole="adjustable"
				accessibilityState={{ disabled: isDisabled }}
				accessibilityValue={{
					max: isHue ? 360 : 100,
					min: 0,
					now,
					text: isHue ? describeHueValue(hsva.h) : describeAlphaValue(hsva.a),
				}}
				accessible
				className={slots.touchArea({ className })}
				onAccessibilityAction={handleAccessibilityAction}
				testID={testID}
				{...props}
			>
				<Animated.View className={slots.track()} onLayout={handleLayout}>
					<Animated.View className={slots.trackSurface()}>
						{isHue ? (
							<ColorPickerHueGradient end={inset.end} start={inset.start} />
						) : (
							<>
								<Animated.View style={[StyleSheet.absoluteFill, colorStyle]} />
								<ColorPickerCheckerboard fade={inset} />
							</>
						)}
						<View className={slots.edge({ className: "rounded-full" })} />
					</Animated.View>
					<ColorPickerThumb
						extent={width}
						isGrabbed={isGrabbed}
						onSize={handleThumbSize}
						size={thumbSize}
						testID={testID ? `${testID}-thumb` : undefined}
						tint={isHue ? "hue" : "alpha"}
						x={x}
					/>
				</Animated.View>
			</Animated.View>
		</GestureDetector>
	);
}
ColorPickerTrack.displayName = "DelacourUI.ColorPicker.Track";

/** Module scope: a fresh array each render is a new prop every commit. */
const ACCESSIBILITY_ACTIONS = [{ name: "increment" }, { name: "decrement" }] as const;
