import { type ReactElement, useCallback, useEffect, useMemo } from "react";
import type { AccessibilityActionEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { Icon, type IconComponent, IconDefaultsProvider } from "../icon";
import { InputGroupPrefix } from "../input/input-group-prefix";
import { InputGroupSuffix } from "../input/input-group-suffix";
import { playHaptic } from "../pressable";
import { useNumberInputPart } from "./number-input.context";
import { resolveRepeatMultiplier, resolveStepHaptic, type StepOutcome } from "./number-input.format";
import type { NumberInputStepperProps } from "./number-input.types";
import {
	NUMBER_INPUT_STEPPER_PRESSED_OPACITY,
	numberInputVariants,
	resolveStepperHitSlop,
	resolveStepperIconToken,
} from "./number-input.variants";
import { type StepRepeatTick, useStepRepeat } from "./use-step-repeat";

/** How far a finger can drift during a hold before the hold is dropped, in points. */
const STEPPER_MAX_DRIFT = 24;

const PRESS_FADE = { duration: 90 } as const;

/**
 * The shared body behind `NumberInput.Decrement` and `.Increment`.
 *
 * Not built on `Pressable`, and that is forced: `Pressable` is a tap, and a tap
 * neither reports press-in nor survives a long hold — Gesture Handler fails a
 * tap after half a second, which would end every hold-to-repeat at the fifth
 * tick. A `LongPress` with no minimum duration activates on touch-down and
 * finalises on release, which is exactly the press-in and press-out a repeat
 * needs. The fade is the same idea as `Pressable`'s, on the inner target only,
 * so the separator never flickers.
 *
 * The press itself is the first step, so there is no `onPress`: stepping again
 * on release would step twice per tap.
 *
 * Not a part: it takes the caller-facing name so the error thrown outside a
 * number input names `NumberInput.Decrement` rather than something private.
 */
export function NumberInputStepper({
	part,
	direction,
	icon,
	defaultLabel,
	position,
	accessibilityLabel,
	className,
	children,
	testID,
}: NumberInputStepperProps & {
	part: string;
	direction: 1 | -1;
	icon: IconComponent;
	defaultLabel: string;
	position: NonNullable<NumberInputStepperProps["position"]>;
}): ReactElement {
	const context = useNumberInputPart(part);
	const { haptic, largeStepMultiplier, size, stepBy } = context;
	const canStep = direction === 1 ? context.canIncrement : context.canDecrement;

	const tick = useCallback(
		(count: number): StepRepeatTick => {
			const result = stepBy(direction, resolveRepeatMultiplier(count, largeStepMultiplier));
			const outcome: StepOutcome = result.blocked ? "blocked" : result.reachedLimit ? "reached-limit" : "applied";
			const feedback = haptic === false ? null : resolveStepHaptic({ outcome, tick: count });
			if (haptic !== false && feedback !== null) scheduleOnUI(playHaptic, feedback === "limit" ? "light" : haptic);
			return outcome === "applied" ? "continue" : "stop";
		},
		[direction, haptic, largeStepMultiplier, stepBy]
	);

	const { start, stop } = useStepRepeat(tick);

	// A stepper that can no longer step — a limit reached, the input disabled
	// or made read-only mid-hold — stops repeating, whatever the finger does.
	useEffect(() => {
		if (!canStep) stop();
	}, [canStep, stop]);

	const pressed = useSharedValue(0);
	const hitSlop = resolveStepperHitSlop(size);

	const gesture = useMemo(() => {
		const hold = Gesture.LongPress()
			.minDuration(0)
			.maxDistance(STEPPER_MAX_DRIFT)
			.shouldCancelWhenOutside(true)
			.enabled(canStep)
			.onStart(() => {
				"worklet";
				pressed.value = withTiming(1, PRESS_FADE);
				scheduleOnRN(start);
			})
			.onFinalize(() => {
				"worklet";
				pressed.value = withTiming(0, PRESS_FADE);
				scheduleOnRN(stop);
			});
		return hitSlop > 0 ? hold.hitSlop(hitSlop) : hold;
	}, [canStep, hitSlop, pressed, start, stop]);

	const pressStyle = useAnimatedStyle(() => ({
		opacity: 1 - pressed.value * (1 - NUMBER_INPUT_STEPPER_PRESSED_OPACITY),
	}));

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (event.nativeEvent.actionName === "activate" && canStep) stepBy(direction);
		},
		[canStep, direction, stepBy]
	);

	const slots = numberInputVariants({ isDisabled: !canStep, position, size });
	const iconDefaults = useMemo(
		() => ({ className: slots.stepperIcon(), color: resolveStepperIconToken({ isDisabled: !canStep }) }),
		[canStep, slots]
	);

	const Decorator = position === "start" ? InputGroupPrefix : InputGroupSuffix;

	// The `activate` action is what a screen reader's double-tap calls. Declaring
	// it means VoiceOver steps through this handler rather than synthesising a
	// touch the hold gesture would read as a press-in with no press-out.
	return (
		<Decorator className={slots.stepper({ className })}>
			<GestureDetector gesture={gesture}>
				<Animated.View
					accessibilityActions={[{ name: "activate" }]}
					accessibilityLabel={accessibilityLabel ?? defaultLabel}
					accessibilityRole="button"
					accessibilityState={{ disabled: !canStep }}
					accessible
					className={slots.stepperTarget()}
					onAccessibilityAction={handleAccessibilityAction}
					style={pressStyle}
					testID={testID}
				>
					<IconDefaultsProvider value={iconDefaults}>{children ?? <Icon icon={icon} />}</IconDefaultsProvider>
				</Animated.View>
			</GestureDetector>
		</Decorator>
	);
}
NumberInputStepper.displayName = "DelacourUI.NumberInput.Stepper";
