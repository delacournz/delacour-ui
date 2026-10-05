import { type ReactElement, useCallback, useMemo } from "react";
import { type AccessibilityActionEvent, type LayoutChangeEvent, StyleSheet, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useFieldContext } from "../field/field.context";
import { playHaptic } from "../pressable";
import { areaToHsv, hsvToArea, hsvToRgb, stepHsva } from "./color-picker.color";
import { useColorPickerPart } from "./color-picker.context";
import type { HsvaChannel } from "./color-picker.types";
import {
	COLOR_PICKER_STEP,
	colorPickerVariants,
	describeAreaValue,
	resolveColorPickerLabel,
} from "./color-picker.variants";
import { ColorPickerAreaGradient } from "./color-picker-gradient";
import { ColorPickerThumb } from "./color-picker-thumb";

export type ColorPickerAreaProps = Omit<ViewProps, "children" | "style"> & {
	/** The name a screen reader reads. Defaults to "Saturation and brightness", prefixed by the `Field.Label`. */
	accessibilityLabel?: string;
	className?: string;
};

/**
 * Saturation across, brightness down, over the current hue.
 *
 * **The drag never renders React.** One `Gesture.Pan()` writes the live model on
 * the UI thread; the hue layer, the thumb and every other part read that shared
 * value in animated styles. JavaScript hears about a frame only when a caller
 * passed `onValueChange`, and the settled state catches up on release.
 *
 * **The value is written in `onBegin`**, Slider's rule: a pan activates on the
 * first movement, so a stationary tap would never reach `onUpdate`. `onFinalize`
 * is where the drag ends because it fires on every path.
 *
 * **Brightness at zero keeps the hue and saturation.** The gesture writes only
 * `s` and `v`, so dragging into the black bottom edge and back comes back to
 * the colour that went down rather than to red.
 *
 * Adjustable in both axes for a screen reader: increment and decrement move
 * saturation by five percent, and two custom actions, Brighter and Darker, move
 * brightness.
 */
export function ColorPickerArea({ accessibilityLabel, className, ...props }: ColorPickerAreaProps): ReactElement {
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
	} = useColorPickerPart("ColorPicker.Area");
	const field = useFieldContext();
	const slots = colorPickerVariants({ size, isDisabled });

	const width = useSharedValue(0);
	const height = useSharedValue(0);
	const thumbSize = useSharedValue(0);
	const isGrabbed = useSharedValue(false);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			width.value = event.nativeEvent.layout.width;
			height.value = event.nativeEvent.layout.height;
		},
		[height, width]
	);

	const gesture = useMemo(() => {
		// Beside its callers rather than at module scope — see Slider's AGENTS.md on
		// module-scope worklets binding in source order.
		const applyTouch = (x: number, y: number) => {
			"worklet";
			const { s, v } = areaToHsv(x, y, width.value, height.value);
			const next = { ...live.value, s, v };
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
				applyTouch(event.x, event.y);
			})
			.onUpdate((event) => {
				"worklet";
				applyTouch(event.x, event.y);
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
		height,
		isDisabled,
		isGrabbed,
		isReadOnly,
		live,
		width,
	]);

	const x = useDerivedValue(() => hsvToArea(live.value.s, live.value.v, width.value, height.value).x);
	const y = useDerivedValue(() => hsvToArea(live.value.s, live.value.v, width.value, height.value).y);

	const hueStyle = useAnimatedStyle(() => {
		const { r, g, b } = hsvToRgb({ h: live.value.h, s: 1, v: 1, a: 1 });
		return { backgroundColor: `rgb(${r}, ${g}, ${b})` };
	});

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (isDisabled || isReadOnly) return;
			const action = AREA_ACTIONS[event.nativeEvent.actionName as AreaActionName];
			if (!action) return;
			setHsva(stepHsva(hsva, action.channel, action.direction, COLOR_PICKER_STEP), { commit: true });
		},
		[hsva, isDisabled, isReadOnly, setHsva]
	);

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				accessibilityActions={ACCESSIBILITY_ACTIONS}
				accessibilityLabel={resolveColorPickerLabel({
					label: field?.label,
					override: accessibilityLabel,
					part: "Saturation and brightness",
				})}
				accessibilityRole="adjustable"
				accessibilityState={{ disabled: isDisabled }}
				accessibilityValue={{ text: describeAreaValue(hsva) }}
				accessible
				className={slots.area({ className })}
				onAccessibilityAction={handleAccessibilityAction}
				onLayout={handleLayout}
				{...props}
			>
				<Animated.View className={slots.areaSurface()}>
					<Animated.View style={[StyleSheet.absoluteFill, hueStyle]} />
					<ColorPickerAreaGradient />
				</Animated.View>
				<ColorPickerThumb
					className="top-0"
					extent={width}
					isGrabbed={isGrabbed}
					size={thumbSize}
					tint="color"
					x={x}
					y={y}
				/>
			</Animated.View>
		</GestureDetector>
	);
}
ColorPickerArea.displayName = "DelacourUI.ColorPicker.Area";

type AreaActionName = "increment" | "decrement" | "brighter" | "darker";

/** What each assistive action moves. Saturation is the swipe; brightness is a named action. */
const AREA_ACTIONS: Record<AreaActionName, { channel: HsvaChannel; direction: 1 | -1 }> = {
	increment: { channel: "saturation", direction: 1 },
	decrement: { channel: "saturation", direction: -1 },
	brighter: { channel: "brightness", direction: 1 },
	darker: { channel: "brightness", direction: -1 },
};

/** Module scope: a fresh array each render is a new prop every commit. */
const ACCESSIBILITY_ACTIONS = [
	{ name: "increment" },
	{ name: "decrement" },
	{ name: "brighter", label: "Brighter" },
	{ name: "darker", label: "Darker" },
] as const;
