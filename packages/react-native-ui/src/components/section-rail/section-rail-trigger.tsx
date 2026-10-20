import { type ReactElement, useCallback, useMemo } from "react";
import { type AccessibilityActionEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { playHaptic } from "../pressable";
import { useSectionRailPart } from "./section-rail.context";
import { resolveScrubIndex, sectionRailVariants } from "./section-rail.variants";

export type SectionRailTriggerProps = ViewProps & { className?: string };

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
 * `Rating.Stars`' reason. One `Gesture.Exclusive(pan, tap)` decides it: the pan
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
 * To VoiceOver it is one `adjustable` element named "Sections" and valued by the
 * active row's title; a swipe up or down moves to the next or previous section,
 * and a double-tap opens the panel.
 */
export function SectionRailTrigger({ className, children, ...props }: SectionRailTriggerProps): ReactElement {
	const { activeValue, bars, frameStyle, haptic, highlight, isOpen, labels, pick, placement, setOpen, step } =
		useSectionRailPart("SectionRail.Trigger");
	const scrubbed = useSharedValue<string | undefined>(undefined);

	const open = useCallback(() => setOpen(true), [setOpen]);

	const gesture = useMemo(() => {
		// Beside its callers rather than at module scope, so it is captured by
		// ordinary closure — see Slider's AGENTS.md on module-scope worklets.
		const scrubTo = (y: number) => {
			"worklet";
			const list = bars.value;
			const index = resolveScrubIndex(
				y,
				list.map((bar) => bar.y ?? 0),
				list.map((bar) => bar.height)
			);
			const next = list[index]?.value;
			if (next === undefined || next === scrubbed.value) return;
			scrubbed.value = next;
			scheduleOnRN(highlight, next);
			if (haptic !== false) playHaptic(haptic);
		};

		const pan = Gesture.Pan()
			.activeOffsetY([-SCRUB_ACTIVE_OFFSET, SCRUB_ACTIVE_OFFSET])
			.failOffsetX([-SCRUB_FAIL_OFFSET, SCRUB_FAIL_OFFSET])
			.shouldCancelWhenOutside(false)
			.onStart((event) => {
				"worklet";
				scrubbed.value = undefined;
				scheduleOnRN(open);
				scrubTo(event.y);
			})
			.onUpdate((event) => {
				"worklet";
				scrubTo(event.y);
			})
			.onEnd(() => {
				"worklet";
				const picked = scrubbed.value;
				if (picked !== undefined) scheduleOnRN(pick, picked);
			})
			.onFinalize((_event, success) => {
				"worklet";
				if (!success && scrubbed.value !== undefined) scheduleOnRN(highlight, undefined);
				scrubbed.value = undefined;
			});

		const tap = Gesture.Tap().onEnd(() => {
			"worklet";
			if (haptic !== false) playHaptic(haptic);
			scheduleOnRN(open);
		});

		return Gesture.Exclusive(pan, tap);
	}, [bars, haptic, highlight, open, pick, scrubbed]);

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
					accessibilityLabel="Sections"
					accessibilityRole="adjustable"
					accessibilityState={{ expanded: isOpen }}
					accessibilityValue={{ text: label }}
					accessible
					className={slots.trigger({ className })}
					onAccessibilityAction={handleAccessibilityAction}
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
