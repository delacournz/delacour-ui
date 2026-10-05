import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { type AccessibilityActionEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { playHaptic } from "../pressable";
import { projectSnap } from "../splitter/splitter.math";
import { useSplitViewPart } from "./split-view.context";
import type { SplitViewSlotProps } from "./split-view.types";
import {
	resolveDragHeight,
	resolveSnapAccessibility,
	resolveSplitViewAction,
	SPLIT_VIEW_DECELERATION_RATE,
	SPLIT_VIEW_TAP_SLOP,
	splitViewVariants,
} from "./split-view.variants";
import { SplitViewHandle } from "./split-view-handle";

/** What the drag row is called when the caller names nothing more specific. */
const DEFAULT_LABEL = "Resize panes";

export type SplitViewDragAreaProps = Omit<ViewProps, "style"> &
	SplitViewSlotProps & {
		/** Read before the position. Default "Resize panes". Say which panes: "Resize map". */
		accessibilityLabel?: string;
		/** Default: a `SplitView.Handle`. Pass your own grip, or a label. */
		children?: ReactNode;
	};

/**
 * The 44pt row between the panes: the only thing that moves them, and the whole
 * of the control for anyone not using a finger.
 *
 * **The drag runs on the UI thread.** `onBegin` stops any settle in flight and
 * snapshots the top pane's height; `onUpdate` follows the finger from that
 * snapshot — never from the live value, so the drag cannot accumulate error —
 * rubber-banded past the lowest and highest stop; `onEnd` projects the release
 * with `projectSnap` and springs to that stop carrying the finger's velocity.
 * JS hears about a drag exactly once, through `commitDrag`.
 *
 * **The haptic tracks the projected stop, not the finger.** Each frame works out
 * where a release *now* would land; when that changes, it plays — once per
 * change, never per frame.
 *
 * **A tap cycles.** A `Tap` runs simultaneously with the pan, and both share
 * {@link SPLIT_VIEW_TAP_SLOP}: a touch that travels less than it is a tap, and
 * the pan puts the pane back where it was; one that travels further is a drag,
 * and the tap has already failed. So one touch never both settles and cycles.
 *
 * **`minDistance(0)` and `shouldCancelWhenOutside(false)`**, for the reasons
 * `Slider.Track` gives: the first gesture to move wins the race against a
 * surrounding scroll view, and a finger dragging the row routinely leaves it.
 *
 * Assistively it is `adjustable`: the value is "Position N of M", increment and
 * decrement step one stop (offered only where there is a stop to step to), and
 * activate cycles like a tap — announcing the new position, which a screen
 * reader does not read on its own for an activate.
 */
export function SplitViewDragArea({
	accessibilityLabel,
	children,
	className,
	...props
}: SplitViewDragAreaProps): ReactElement {
	const {
		variant,
		isDisabled,
		snapIndex,
		snapCount,
		top,
		extent,
		heights,
		haptic,
		setActive,
		interrupt,
		settle,
		commitDrag,
		cycle,
		snapTo,
	} = useSplitViewPart("SplitView.DragArea");

	const start = useSharedValue(0);
	const moved = useSharedValue(false);
	const projected = useSharedValue(-1);

	const gesture = useMemo(() => {
		const pan = Gesture.Pan()
			.enabled(!isDisabled)
			.minDistance(0)
			.shouldCancelWhenOutside(false)
			.onBegin(() => {
				"worklet";
				interrupt();
				start.value = top.value;
				moved.value = false;
				projected.value = snapIndex;
				scheduleOnRN(setActive, true);
			})
			.onUpdate((event) => {
				"worklet";
				if (extent.value <= 0) return;
				if (Math.abs(event.translationY) > SPLIT_VIEW_TAP_SLOP) moved.value = true;
				const height = resolveDragHeight({
					extent: extent.value,
					heights,
					start: start.value,
					translation: event.translationY,
				});
				top.value = height;
				if (!moved.value) return;
				const target = projectSnap({
					decelerationRate: SPLIT_VIEW_DECELERATION_RATE,
					points: heights,
					position: height,
					velocity: event.velocityY,
				});
				if (target !== projected.value && haptic !== false) playHaptic(haptic);
				projected.value = target;
			})
			.onEnd((event) => {
				"worklet";
				if (!moved.value) return;
				const target = projectSnap({
					decelerationRate: SPLIT_VIEW_DECELERATION_RATE,
					points: heights,
					position: top.value,
					velocity: event.velocityY,
				});
				if (target < 0) return;
				if (target !== projected.value && haptic !== false) playHaptic(haptic);
				projected.value = target;
				settle(target, event.velocityY);
				scheduleOnRN(commitDrag, target);
			})
			.onFinalize(() => {
				"worklet";
				scheduleOnRN(setActive, false);
				if (!moved.value) settle(snapIndex, 0);
				moved.value = false;
			});

		const tap = Gesture.Tap()
			.enabled(!isDisabled)
			.maxDistance(SPLIT_VIEW_TAP_SLOP)
			.onEnd((_event, success) => {
				"worklet";
				if (success) scheduleOnRN(cycle, false);
			});

		return Gesture.Simultaneous(pan, tap);
	}, [
		commitDrag,
		cycle,
		extent,
		haptic,
		heights,
		interrupt,
		isDisabled,
		moved,
		projected,
		setActive,
		settle,
		snapIndex,
		start,
		top,
	]);

	const a11y = resolveSnapAccessibility({ count: snapCount, index: snapIndex });
	const actions = useMemo(
		() =>
			isDisabled
				? NO_ACTIONS
				: [...(a11y.canIncrement ? [INCREMENT] : []), ...(a11y.canDecrement ? [DECREMENT] : []), ACTIVATE],
		[a11y.canDecrement, a11y.canIncrement, isDisabled]
	);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (isDisabled) return;
			const action = resolveSplitViewAction({
				count: snapCount,
				index: snapIndex,
				name: event.nativeEvent.actionName,
			});
			if (action?.source === "cycle") cycle(true);
			else if (action?.source === "adjust") snapTo(action.index);
		},
		[cycle, isDisabled, snapCount, snapIndex, snapTo]
	);

	const slots = splitViewVariants({ isDisabled, variant });

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				accessibilityActions={actions}
				accessibilityLabel={accessibilityLabel ?? DEFAULT_LABEL}
				accessibilityRole="adjustable"
				accessibilityState={{ disabled: isDisabled }}
				accessibilityValue={{ max: a11y.max, min: a11y.min, now: a11y.now, text: a11y.text }}
				accessible
				className={slots.dragArea({ className })}
				onAccessibilityAction={handleAccessibilityAction}
				{...props}
			>
				{variant === "seam" ? <View className={slots.rule()} pointerEvents="none" /> : null}
				{children ?? <SplitViewHandle />}
			</Animated.View>
		</GestureDetector>
	);
}
SplitViewDragArea.displayName = "DelacourUI.SplitView.DragArea";

/**
 * The actions, at module scope: a fresh object each render is a new prop every
 * commit, and React Native sends the whole accessibility config across on any
 * change.
 */
const INCREMENT = { name: "increment" } as const;
const DECREMENT = { name: "decrement" } as const;
const ACTIVATE = { label: "Next position", name: "activate" } as const;
const NO_ACTIONS: readonly { name: string; label?: string }[] = [];
