import { type ComponentRef, type ReactElement, type Ref, useCallback } from "react";
import { type AccessibilityActionEvent, View, type ViewProps } from "react-native";
import { GestureDetector, useExclusiveGestures, usePanGesture, useTapGesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { composeRefs } from "../../lib/compose-refs";
import { playHaptic } from "../pressable";
import { useSectionRailPart } from "./section-rail.context";
import { resolveScrubIndex, sectionRailVariants } from "./section-rail.variants";

export type SectionRailTriggerProps = ViewProps & { className?: string; ref?: Ref<ComponentRef<typeof View>> };

/** Points of vertical travel before a touch on the rail becomes a scrub. */
const SCRUB_ACTIVE_OFFSET = 4;
/** Points of sideways travel that hand the touch back — a swipe, not a scrub. */
const SCRUB_FAIL_OFFSET = 16;

/**
 * The rail: a column of bars, the touch surface over them, and — to assistive
 * technology — the whole control.
 *
 * **It is not a `Pressable`.** Its one touch is either a tap (open) or a scrub
 * (open, follow the finger, commit on release), and a `Pressable` would nest a
 * second tap inside the scrub's pan and leave them to negotiate for one touch —
 * `Rating.Stars`' reason. One `useExclusiveGestures(pan, tap)` decides it: the pan
 * wins once the finger travels four points up or down, and the tap fires only
 * when it never does. The haptic still comes from `playHaptic`, the library's
 * one haptic switch, from inside the worklet.
 *
 * **The scrub runs on the UI thread.** The bars' boxes are mirrored onto a
 * shared value, so the worklet maps the finger to a section every frame and
 * crosses to React only when the section under it changes — once per row, which
 * is also when it ticks.
 *
 * It is positioned in a frame that fills the rail and passes touches through,
 * so the only thing hit-tested is the trigger itself: at least 44pt wide however
 * thin the bars inside it are.
 *
 * To VoiceOver it is one `adjustable` element named `labels.trigger` ("Sections") and valued by the
 * active row's title; a swipe up or down moves to the next or previous section,
 * and a double-tap opens the panel.
 */
export function SectionRailTrigger({ className, children, ref, ...props }: SectionRailTriggerProps): ReactElement {
	const {
		activeValue,
		bars,
		frameStyle,
		haptic,
		highlight,
		isOpen,
		labels,
		pick,
		placement,
		setOpen,
		spoken,
		step,
		triggerRef,
	} = useSectionRailPart("SectionRail.Trigger");
	const scrubbed = useSharedValue<string | undefined>(undefined);

	const open = useCallback(() => setOpen(true), [setOpen]);

	// Beside its callers rather than at module scope, so it is captured by
	// ordinary closure — see Slider's AGENTS.md on module-scope worklets.
	const scrubTo = (y: number) => {
		"worklet";
		const list = bars.value;
		// Loops, not `.map((bar) => …)`: a capture-free arrow in a component is
		// hoisted by the React Compiler to a module function the UI thread
		// cannot call.
		const tops: number[] = [];
		const heights: number[] = [];
		for (const bar of list) {
			tops.push(bar.y ?? 0);
			heights.push(bar.height);
		}
		const index = resolveScrubIndex(y, tops, heights);
		const next = list[index]?.value;
		if (next === undefined || next === scrubbed.value) return;
		scrubbed.value = next;
		scheduleOnRN(highlight, next);
		if (haptic !== false) playHaptic(haptic);
	};

	const pan = usePanGesture({
		activeOffsetY: [-SCRUB_ACTIVE_OFFSET, SCRUB_ACTIVE_OFFSET],
		failOffsetX: [-SCRUB_FAIL_OFFSET, SCRUB_FAIL_OFFSET],
		shouldCancelWhenOutside: false,
		onActivate: (event) => {
			"worklet";
			scrubbed.value = undefined;
			scheduleOnRN(open);
			scrubTo(event.y);
		},
		onUpdate: (event) => {
			"worklet";
			scrubTo(event.y);
		},
		onDeactivate: () => {
			"worklet";
			const picked = scrubbed.value;
			if (picked !== undefined) scheduleOnRN(pick, picked);
		},
		onFinalize: (event) => {
			"worklet";
			if (event.canceled && scrubbed.value !== undefined) scheduleOnRN(highlight, undefined);
			scrubbed.value = undefined;
		},
	});

	const tap = useTapGesture({
		onDeactivate: () => {
			"worklet";
			if (haptic !== false) playHaptic(haptic);
			scheduleOnRN(open);
		},
	});

	const gesture = useExclusiveGestures(pan, tap);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			switch (event.nativeEvent.actionName) {
				case "increment":
					step(1);
					return;
				case "decrement":
					step(-1);
					return;
				case "activate":
					setOpen(!isOpen);
					return;
				default:
					return;
			}
		},
		[isOpen, setOpen, step]
	);

	const label = activeValue === undefined ? "" : (labels[activeValue] ?? "");
	const slots = sectionRailVariants({ placement });

	return (
		<View className={slots.frame()} pointerEvents="box-none" style={frameStyle}>
			<GestureDetector gesture={gesture}>
				<View
					accessibilityActions={ACCESSIBILITY_ACTIONS}
					accessibilityLabel={spoken.trigger}
					accessibilityRole="adjustable"
					accessibilityState={{ expanded: isOpen }}
					accessibilityValue={{ text: label }}
					accessible
					className={slots.trigger({ className })}
					onAccessibilityAction={handleAccessibilityAction}
					ref={composeRefs(triggerRef, ref)}
					{...props}
				>
					{children}
				</View>
			</GestureDetector>
		</View>
	);
}
SectionRailTrigger.displayName = "DelacourUI.SectionRail.Trigger";

/**
 * The actions an assistive swipe and double-tap map to on an `adjustable`.
 *
 * Module scope on purpose: a fresh array each render is a new prop every commit.
 */
const ACCESSIBILITY_ACTIONS = [{ name: "increment" }, { name: "decrement" }, { name: "activate" }] as const;
