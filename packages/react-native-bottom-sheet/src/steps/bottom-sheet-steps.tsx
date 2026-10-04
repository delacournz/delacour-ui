import { type ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, Platform, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { type ReanimatedAnimation, toReanimated } from "../animation/resolve-animation";
import { useBottomSheet, useBottomSheetInternal } from "../components/bottom-sheet.context";
import { BottomSheetContent } from "../components/bottom-sheet-content";
import {
	GESTURE_SOURCE,
	heightForIndex,
	type SheetEvent,
	type SheetStepDirection,
	selectAnimation,
	stepOverride,
	UNMEASURED,
} from "../core";
import { ANIM_STATUS } from "../state/state.types";
import { SheetStepContext, StepsLayoutContext, type StepsLayoutValue } from "./steps.context";
import type { BottomSheetStepsProps, SheetStepController } from "./steps.types";

type Stage<S extends string> = { active: S; outgoing: S | null; direction: SheetStepDirection };

/** Hands `value` to a spring or a timing, with `complete` on the UI thread once it lands. */
function animateWith(animation: ReanimatedAnimation, value: number, complete: (finished?: boolean) => void): number {
	if (animation.type === "spring") return withSpring(value, animation.config, complete);
	return withTiming(value, animation.config, complete);
}

/**
 * A multi-step body: the `Content` of a sheet whose contents change with a
 * machine.
 *
 * It is `Content` with a stack inside — each `Step` is absolutely positioned
 * across the top of the stack and only the current step and, during a change,
 * the one leaving are rendered. The stack's height is a shared value animated
 * to whatever the current step measures, and that same measurement is written
 * to the sheet's `contentHeight` the moment it lands, so the dynamic snap point
 * moves once and the root's snap-point-change reaction animates `base` there with
 * the same spring the body is using: the panel's top edge and the body's
 * bottom edge glide together, and a sheet resting on an explicit snap point does
 * not move at all. Should the sheet have been busy when the snap point moved — a
 * step change mid-open — the height animation's completion nudges it onto its
 * snap point.
 *
 * `Content`'s own measurement is switched off while this is the body, or its
 * layout events would race the animated height with stale numbers.
 *
 * The step the machine is on decides two things about the sheet: its
 * `snapPoints` replace the root's while it is current (and dynamic sizing is
 * off for it — a step that names its snap points is sized by them), and
 * `dismissible: false` disables pan-down-to-close and the overlay's press.
 * Both go through the root, since the overlay is not a descendant of the body.
 *
 * The controller is provided to every descendant through `SheetStepContext`,
 * and registered with the root so a `Footer` written beside this body reaches
 * it through `useSheetStep` too.
 */
export function BottomSheetSteps<S extends string, C, E extends SheetEvent>({
	controller,
	transition = "crossfade",
	animation,
	resetOnClose = true,
	footerGap,
	children,
	style,
	ref,
	...props
}: BottomSheetStepsProps<S, C, E>): ReactElement {
	const internal = useBottomSheetInternal();
	const { state, geometry, animateTo, setContentHeightSource, setStepOverride, setStepController } = internal;
	const { isOpen } = useBottomSheet();
	const stepHeight = useSharedValue(UNMEASURED);
	const progress = useSharedValue(1);

	const [stage, setStage] = useState<Stage<S>>({ active: controller.value, outgoing: null, direction: "forward" });
	const changePending = useRef(false);
	const lastHeight = useRef(UNMEASURED);

	// Derived during render, so the incoming step mounts in the same commit the
	// machine moved in and its first layout is the one that starts the change.
	if (controller.value !== stage.active) {
		changePending.current = true;
		setStage({
			active: controller.value,
			outgoing: transition === "none" ? null : stage.active,
			direction: controller.direction,
		});
	}

	const animationKey = JSON.stringify(animation ?? internal.animation ?? null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: the animation is keyed by its serialisation
	const resolved = useMemo(
		() => toReanimated(selectAnimation(animation ?? internal.animation, Platform.OS, internal.overrideReduceMotion)),
		[animationKey, internal.overrideReduceMotion]
	);

	useLayoutEffect(() => {
		setContentHeightSource("steps");
		return () => setContentHeightSource("content");
	}, [setContentHeightSource]);

	const { machine, value } = controller;
	useLayoutEffect(() => {
		setStepOverride(stepOverride(machine.nodeOf(value)));
	}, [machine, value, setStepOverride]);
	useEffect(() => () => setStepOverride(null), [setStepOverride]);

	// The ref during render, so a `Footer` rendered after this body in the
	// same pass reads the controller; the state from an effect, to re-render
	// anything that did not.
	const untyped = controller as unknown as SheetStepController<string, unknown, SheetEvent>;
	internal.stepControllerRef.current = untyped;
	useLayoutEffect(() => {
		setStepController(untyped);
	}, [untyped, setStepController]);
	useEffect(
		() => () => {
			internal.stepControllerRef.current = null;
			setStepController(null);
		},
		[internal.stepControllerRef, setStepController]
	);

	// A close resets the machine: through the `isOpen` flip for a body that
	// stays mounted, and through unmount for one the portal takes down.
	const latest = useRef({ controller, resetOnClose });
	latest.current = { controller, resetOnClose };
	useEffect(() => {
		if (isOpen || !latest.current.resetOnClose) return;
		latest.current.controller.reset();
	}, [isOpen]);
	useEffect(
		() => () => {
			if (latest.current.resetOnClose) latest.current.controller.reset();
		},
		[]
	);

	const finishChange = useCallback(() => {
		setStage((current) => (current.outgoing === null ? current : { ...current, outgoing: null }));
	}, []);

	const onActiveLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const height = event.nativeEvent.layout.height;
			const changing = changePending.current;
			changePending.current = false;
			if (lastHeight.current === height && !changing) return;
			const first = lastHeight.current < 0;
			lastHeight.current = height;
			state.contentHeight.value = height;
			if (first) {
				stepHeight.value = height;
				return;
			}

			const settle = (finished?: boolean): void => {
				"worklet";
				if (finished !== true) return;
				const busy = state.animStatus.value !== ANIM_STATUS.IDLE || state.gestureSource.value !== GESTURE_SOURCE.NONE;
				const index = state.currentIndex.value;
				const snapPoints = geometry.snapPoints.value;
				if (busy || index < 0 || snapPoints.length === 0) return;
				const target = heightForIndex(Math.min(index, snapPoints.length - 1), snapPoints, geometry.closedHeight.value);
				if (Math.abs(target - state.base.value) > 0.5) animateTo(target, "snapPoints", 0);
			};
			stepHeight.value = animateWith(resolved, height, settle);

			if (!changing) return;
			if (transition === "none") {
				progress.value = 1;
				return;
			}
			const complete = (finished?: boolean): void => {
				"worklet";
				if (finished === true) scheduleOnRN(finishChange);
			};
			progress.value = 0;
			progress.value = animateWith(resolved, 1, complete);
		},
		[state, geometry, animateTo, resolved, transition, stepHeight, progress, finishChange]
	);

	const stack = useAnimatedStyle(() => ({
		height: stepHeight.value >= 0 ? stepHeight.value : undefined,
	}));

	const layoutValue = useMemo<StepsLayoutValue>(
		() => ({
			active: stage.active,
			outgoing: stage.outgoing,
			direction: stage.direction,
			transition,
			progress,
			width: state.containerWidth,
			onActiveLayout,
		}),
		[stage, transition, progress, state.containerWidth, onActiveLayout]
	);

	return (
		<SheetStepContext.Provider value={untyped}>
			<StepsLayoutContext.Provider value={layoutValue}>
				<BottomSheetContent footerGap={footerGap} ref={ref} style={style} {...props}>
					<Animated.View style={[styles.stack, stack]}>{children}</Animated.View>
				</BottomSheetContent>
			</StepsLayoutContext.Provider>
		</SheetStepContext.Provider>
	);
}
BottomSheetSteps.displayName = "DelacourBottomSheet.BottomSheet.Steps";

const styles = StyleSheet.create({
	stack: { overflow: "hidden", width: "100%" },
});
