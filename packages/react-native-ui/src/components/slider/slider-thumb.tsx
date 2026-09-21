import { type ComponentProps, type ReactElement, useCallback } from "react";
import type { AccessibilityActionEvent, LayoutChangeEvent, ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from "react-native-reanimated";
import { useSliderPart } from "./slider.context";
import {
	formatSliderValue,
	progressOf,
	SLIDER_THUMB_ANIMATION,
	SLIDER_THUMB_SPRING,
	sliderVariants,
} from "./slider.variants";

/** What one press of an assistive increment moves the value by, when `step` is continuous. */
const CONTINUOUS_ACCESSIBILITY_STEPS = 10;

export type SliderThumbProps = Omit<ViewProps, "children" | "style"> & {
	/** Which value this thumb drives. `0` unless the slider holds a range. */
	index?: number;
	className?: string;
	/**
	 * Passed to the knob inside the capsule.
	 *
	 * A prop rather than a `classNames` map, which is the shape `Radio.Indicator`
	 * already uses for its dot: one escape hatch, named after the thing it reaches,
	 * and it carries every `View` prop rather than only a class.
	 */
	knobProps?: Omit<ComponentProps<typeof Animated.View>, "children" | "className" | "style"> & { className?: string };
};

/**
 * The grab handle.
 *
 * **It holds no gesture of its own**, which is the design rather than an
 * omission. One `Gesture.Pan()` on the track drives every thumb: a press 40pt
 * along an empty groove should still lift the thumb it is about to move, and a
 * per-thumb gesture could not know that. It would also nest a descendant handler
 * inside the track's, leaving two recognisers to negotiate for one drag.
 *
 * **One animated style, one node.** The position and the grabbed scale are two
 * entries in a single `transform`, because two `useAnimatedStyle` calls on one
 * view fight for the same prop and the later one silently wins — the rule
 * `Radio.Indicator` states, and the reason `Pressable` cannot be the thing that
 * moves here.
 *
 * The scale is a `useDerivedValue` rather than a branch inside the position
 * style: it depends only on which thumb is being dragged, so deriving it
 * separately means the spring is evaluated when the grab changes rather than on
 * every frame of the drag.
 *
 * **It is invisible until the track has been measured.** Both layouts arrive a
 * commit or two after mount, and a thumb drawn before then sits at a garbage
 * offset for a frame — which reads as a flicker on every mount.
 *
 * **The accessibility surface lives here**, and it is the whole of the control
 * for anyone not using a finger. `adjustable` plus a value is what VoiceOver and
 * TalkBack read; the increment and decrement actions are what their swipe
 * gestures call. Without them a slider with no gesture on its thumb would have no
 * assistive path to its value at all.
 */
export function SliderThumb({ index = 0, className, knobProps, ...props }: SliderThumbProps): ReactElement {
	const {
		positions,
		trackSize,
		thumbSize,
		activeIndex,
		values,
		minValue,
		maxValue,
		step,
		formatOptions,
		orientation,
		color,
		size,
		isInvalid,
		isDisabled,
		updateValue,
	} = useSliderPart("Slider.Thumb");
	const isVertical = orientation === "vertical";
	const slots = sliderVariants({ color, isDisabled, isInvalid, orientation, size });

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			// Every thumb writes the same number — they are one size — so the last
			// one to lay out wins with the value all of them hold.
			thumbSize.value = isVertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width;
		},
		[isVertical, thumbSize]
	);

	// The capsule carries the position and the knob carries the squeeze, on two
	// different nodes. Two animated styles on *one* node fight for the same prop
	// and the later one silently wins — the rule `Radio.Indicator` states — and
	// scaling the capsule would push it past the track it sits flush inside.
	const thumbStyle = useAnimatedStyle(() => {
		const measured = trackSize.value;
		const travel = measured - thumbSize.value;
		const progress = progressOf(positions.value[index] ?? minValue, minValue, maxValue);
		const offset = travel <= 0 ? 0 : progress * travel;

		return {
			opacity: measured > 0 ? 1 : 0,
			// A vertical slider counts up from the bottom, so the handle is anchored
			// there and travels the other way. This sign and `valueFromOffset`'s
			// inversion are the only two places the axis turns around.
			transform: isVertical ? [{ translateY: -offset }] : [{ translateX: offset }],
		};
	});

	// Derived rather than branched inside the style above: it depends only on which
	// thumb is being dragged, so the spring is evaluated when the grab changes
	// rather than on every frame of the drag.
	const scale = useDerivedValue(() =>
		withSpring(
			activeIndex.value === index ? SLIDER_THUMB_ANIMATION.grabbedScale : SLIDER_THUMB_ANIMATION.restScale,
			SLIDER_THUMB_SPRING
		)
	);
	const knobStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

	const value = values[index] ?? minValue;
	const nudge = step > 0 ? step : (maxValue - minValue) / CONTINUOUS_ACCESSIBILITY_STEPS;

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const direction = event.nativeEvent.actionName === "increment" ? 1 : -1;
			updateValue(index, value + direction * nudge);
		},
		[index, nudge, updateValue, value]
	);

	return (
		<Animated.View
			accessibilityActions={ACCESSIBILITY_ACTIONS}
			accessibilityRole="adjustable"
			accessibilityState={{ disabled: isDisabled }}
			accessibilityValue={{
				max: maxValue,
				min: minValue,
				now: value,
				text: formatSliderValue([value], formatOptions),
			}}
			accessible
			className={slots.thumb({ className })}
			onAccessibilityAction={handleAccessibilityAction}
			onLayout={handleLayout}
			style={thumbStyle}
			{...props}
		>
			<Animated.View {...knobProps} className={slots.knob({ className: knobProps?.className })} style={knobStyle} />
		</Animated.View>
	);
}
SliderThumb.displayName = "DelacourUI.Slider.Thumb";

/**
 * The two actions an assistive swipe on an `adjustable` maps to.
 *
 * Module scope on purpose: a fresh array each render is a new prop every commit,
 * and React Native sends the whole accessibility config across on any change.
 */
const ACCESSIBILITY_ACTIONS = [{ name: "increment" }, { name: "decrement" }] as const;
