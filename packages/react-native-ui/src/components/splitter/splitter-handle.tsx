import { type ReactElement, useCallback, useMemo, useState } from "react";
import { type AccessibilityActionEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { playHaptic } from "../pressable";
import { useSplitterIndex, useSplitterPart } from "./splitter.context";
import type { SplitterSlotProps } from "./splitter.types";
import {
	adjacentCollapsibleIndex,
	formatSplitterValue,
	isPaneCollapsed,
	isSeamHeld,
	resolveDrag,
	resolveDragEnd,
	resolveKeyboardStep,
	SPLITTER_DRAWS_LINE,
	SPLITTER_HANDLE_SIZE,
	seamOffset,
	splitterVariants,
} from "./splitter.variants";
import { SplitterGrip } from "./splitter-grip";

/** What a handle is called when the caller names nothing more specific. */
const DEFAULT_LABEL = "Resize";

export type SplitterHandleProps = Omit<ViewProps, "children" | "style" | "hitSlop"> &
	SplitterSlotProps & {
		/** Freezes this seam alone. The root's `isDisabled` freezes every one. */
		isDisabled?: boolean;
		/** Draw the grip capsule. A bare seam is still draggable. Default true. */
		withGrip?: boolean;
		/** Read before the value. Default "Resize". Say which panes: "Resize sidebar". */
		accessibilityLabel?: string;
		/** Cross-axis touch padding is fixed at 44pt total; this widens it along the axis, in points. Default 0. */
		hitSlop?: number;
	};

/**
 * The draggable seam between two panes, and the whole of the control for
 * anyone not using a finger.
 *
 * **It is laid over the seam, not between the panes.** A 44pt touch box,
 * absolutely positioned and centred on the shared edge, so it takes no room from
 * either pane and a `[30, 70]` layout is exactly thirty and seventy. Its position
 * is an animated style read off the same shared value the panes grow from, so
 * the handle and the edge it sits on cannot drift apart mid-drag.
 *
 * **The drag runs entirely on the UI thread.** `onBegin` snapshots the layout,
 * `onUpdate` turns the translation into a percentage of the box and runs
 * `resolveDrag` against that snapshot — never against the live value, so the
 * drag cannot accumulate error — and `onFinalize` rounds the seam to `step`,
 * settles there and reports once. JS hears about a drag exactly once.
 *
 * **`minDistance(0)` and `shouldCancelWhenOutside(false)`**, for the reasons
 * `Slider.Track` gives: the first gesture to move wins a race against a scroll
 * view's slop, and a finger dragging a seam to the edge of the box routinely
 * leaves the handle's bounds.
 *
 * **A double tap resets.** The tap runs *simultaneously* with the pan rather
 * than exclusively: an exclusive pair makes the pan wait for the tap to fail,
 * which is a dead zone at the start of every drag. A tap moves nothing — the pan
 * only settles once a finger has actually travelled — so the two never disagree.
 *
 * **The edge haptic fires on the way in, not while held.** A worklet remembers
 * whether the last frame was stopped by a bound or collapsed, and only the
 * change from free to stopped plays — once per bound, never once per frame.
 *
 * Assistively it is `adjustable`: its value is the pane before it, increment and
 * decrement move the seam by `step`, and there are actions to reset and — when a
 * pane beside it is collapsible — to collapse or expand that pane.
 */
export function SplitterHandle({
	isDisabled: ownDisabled = false,
	withGrip = true,
	accessibilityLabel,
	hitSlop = 0,
	className,
	...props
}: SplitterHandleProps): ReactElement {
	const index = useSplitterIndex();
	const {
		orientation,
		variant,
		isDisabled: rootDisabled,
		layout,
		constraints,
		sizes,
		extent,
		gap,
		step,
		haptic,
		interrupt,
		settle,
		commitDrag,
		apply,
		reset,
		togglePane,
	} = useSplitterPart("Splitter.Handle");
	const isDisabled = rootDisabled || ownDisabled;
	const isVertical = orientation === "vertical";

	const start = useSharedValue<number[]>([]);
	const delta = useSharedValue(0);
	const wasHeld = useSharedValue(false);
	const wasCollapsed = useSharedValue(false);
	const isHeld = useSharedValue(false);
	const [isActive, setActive] = useState(false);

	const gesture = useMemo(() => {
		const paneCount = constraints.length;

		const pan = Gesture.Pan()
			.enabled(!isDisabled)
			.minDistance(0)
			.shouldCancelWhenOutside(false)
			.hitSlop(isVertical ? { bottom: hitSlop, top: hitSlop } : { left: hitSlop, right: hitSlop })
			.onBegin(() => {
				"worklet";
				interrupt();
				start.value = [...sizes.value];
				delta.value = 0;
				wasHeld.value = false;
				wasCollapsed.value = false;
				isHeld.value = true;
				scheduleOnRN(setActive, true);
			})
			.onUpdate((event) => {
				"worklet";
				const available = extent.value - gap * (paneCount - 1);
				if (available <= 0) return;
				const moved = ((isVertical ? event.translationY : event.translationX) / available) * 100;
				delta.value = moved;
				const next = resolveDrag({ constraints, delta: moved, handleIndex: index, start: start.value });
				sizes.value = next;

				const held = isSeamHeld({ delta: moved, handleIndex: index, layout: next, start: start.value });
				const collapsed = isPaneCollapsed(next, index, constraints) || isPaneCollapsed(next, index + 1, constraints);
				if (haptic !== false && ((held && !wasHeld.value) || (collapsed && !wasCollapsed.value))) {
					playHaptic(haptic);
				}
				wasHeld.value = held;
				wasCollapsed.value = collapsed;
			})
			.onFinalize(() => {
				"worklet";
				isHeld.value = false;
				scheduleOnRN(setActive, false);
				// A tap never moved, so it settles nothing — otherwise every tap on an
				// off-grid seam would round it, and the reset tap would move it twice.
				if (delta.value === 0) return;
				const settled = resolveDragEnd({
					constraints,
					delta: delta.value,
					handleIndex: index,
					start: start.value,
					step,
				});
				delta.value = 0;
				settle(settled);
				scheduleOnRN(commitDrag, settled);
			});

		const doubleTap = Gesture.Tap()
			.enabled(!isDisabled)
			.numberOfTaps(2)
			.onEnd(() => {
				"worklet";
				scheduleOnRN(reset);
			});

		return Gesture.Simultaneous(pan, doubleTap);
	}, [
		commitDrag,
		constraints,
		delta,
		extent,
		gap,
		haptic,
		hitSlop,
		index,
		interrupt,
		isDisabled,
		isHeld,
		isVertical,
		reset,
		settle,
		sizes,
		start,
		step,
		wasCollapsed,
		wasHeld,
	]);

	const positionStyle = useAnimatedStyle(() => {
		const offset = seamOffset({ extent: extent.value, gap, index, sizes: sizes.value }) - SPLITTER_HANDLE_SIZE / 2;
		const opacity = extent.value > 0 ? 1 : 0;
		return isVertical ? { opacity, top: offset } : { left: offset, opacity };
	});

	const collapsibleIndex = adjacentCollapsibleIndex(index, constraints);
	const isCollapsed = collapsibleIndex >= 0 && isPaneCollapsed(layout, collapsibleIndex, constraints);
	const value = layout[index] ?? 0;

	const actions = useMemo(
		() =>
			collapsibleIndex < 0
				? BASE_ACTIONS
				: [
						...BASE_ACTIONS,
						isCollapsed ? { label: "Expand", name: "expand" } : { label: "Collapse", name: "collapse" },
					],
		[collapsibleIndex, isCollapsed]
	);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (isDisabled) return;
			const name = event.nativeEvent.actionName;
			if (name === "increment" || name === "decrement") {
				const next = resolveKeyboardStep({
					constraints,
					direction: name === "increment" ? 1 : -1,
					handleIndex: index,
					layout,
					step,
				});
				if (next !== layout) apply(next);
			} else if (name === "reset") {
				reset();
			} else if ((name === "collapse" || name === "expand") && collapsibleIndex >= 0) {
				togglePane(collapsibleIndex);
			}
		},
		[apply, collapsibleIndex, constraints, index, isDisabled, layout, reset, step, togglePane]
	);

	const slots = splitterVariants({ isActive, isDisabled, orientation, variant });

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				accessibilityActions={actions}
				accessibilityLabel={accessibilityLabel ?? DEFAULT_LABEL}
				accessibilityRole="adjustable"
				accessibilityState={{
					disabled: isDisabled,
					expanded: collapsibleIndex >= 0 ? !isCollapsed : undefined,
				}}
				accessibilityValue={{ max: 100, min: 0, now: Math.round(value), text: formatSplitterValue(value) }}
				accessible
				className={slots.handle({ className })}
				onAccessibilityAction={handleAccessibilityAction}
				style={positionStyle}
				{...props}
			>
				{SPLITTER_DRAWS_LINE[variant] ? <View className={slots.line()} pointerEvents="none" /> : null}
				{withGrip ? <SplitterGrip className={slots.grip()} isHeld={isHeld} orientation={orientation} /> : null}
			</Animated.View>
		</GestureDetector>
	);
}
SplitterHandle.displayName = "DelacourUI.Splitter.Handle";

/**
 * The actions every handle offers. Module scope on purpose: a fresh array each
 * render is a new prop every commit, and React Native sends the whole
 * accessibility config across on any change.
 */
const BASE_ACTIONS: readonly { name: string; label?: string }[] = [
	{ name: "increment" },
	{ name: "decrement" },
	{ label: "Reset sizes", name: "reset" },
];
