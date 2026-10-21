import { type ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { type LayoutChangeEvent, type TextLayoutEvent, useWindowDimensions } from "react-native";
import Animated, {
	Easing,
	type EntryAnimationsValues,
	type ExitAnimationsValues,
	type LayoutAnimation,
	type SharedValue,
	useAnimatedStyle,
	useReducedMotion,
	withTiming,
} from "react-native-reanimated";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useSectionProgressPart } from "./section-progress.context";
import {
	resolveLabelMaxWidth,
	resolveLabelStep,
	resolveLabelWidth,
	SECTION_PROGRESS_LABEL_FADE_MS,
	SECTION_PROGRESS_LABEL_RESIZE_MS,
	SECTION_PROGRESS_LABEL_SHIFT,
	sectionProgressVariants,
} from "./section-progress.variants";
import { SectionProgressRing } from "./section-progress-ring";

type LabelStep = ReturnType<typeof resolveLabelStep>;

const LABEL_EASING = Easing.out(Easing.cubic);
const RESIZE_TIMING = { duration: SECTION_PROGRESS_LABEL_RESIZE_MS, easing: LABEL_EASING } as const;
const EXIT_TIMING = { duration: SECTION_PROGRESS_LABEL_FADE_MS, easing: LABEL_EASING } as const;

/** The new title fades up from below on a forward step, down from above on a back one. */
function labelEntering(step: LabelStep, isReducedMotion: boolean) {
	const from = isReducedMotion ? 0 : step === "forward" ? SECTION_PROGRESS_LABEL_SHIFT : -SECTION_PROGRESS_LABEL_SHIFT;
	return (_values: EntryAnimationsValues): LayoutAnimation => {
		"worklet";
		return {
			initialValues: { opacity: 0, transform: [{ translateY: from }] },
			animations: {
				opacity: withTiming(1, RESIZE_TIMING),
				transform: [{ translateY: withTiming(0, RESIZE_TIMING) }],
			},
		};
	};
}

/** The old title fades out the way the new one is travelling. */
function labelExiting(step: LabelStep, isReducedMotion: boolean) {
	const to = isReducedMotion ? 0 : step === "forward" ? -SECTION_PROGRESS_LABEL_SHIFT : SECTION_PROGRESS_LABEL_SHIFT;
	return (_values: ExitAnimationsValues): LayoutAnimation => {
		"worklet";
		return {
			initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
			animations: {
				opacity: withTiming(0, EXIT_TIMING),
				transform: [{ translateY: withTiming(to, EXIT_TIMING) }],
			},
		};
	};
}

export type SectionProgressPillProps = {
	/** The title box's width, owned by the panel so the capsule can size itself from it on the UI thread. */
	labelWidth: SharedValue<number>;
	/** The row's layout, which the panel reads for its height. */
	onLayout: (event: LayoutChangeEvent) => void;
};

/**
 * The pill's row: the ring and the active section's title, one button that
 * opens and closes the panel.
 *
 * It has no chrome of its own — the panel's surface is the capsule around it
 * closed and the card around it open, so the row never remounts and the card
 * reads as the pill grown out of itself. The title is capped at sixty percent
 * of the window on one line.
 *
 * On a section change the label box eases to the new title's width, so the
 * pill resizes rather than jumps, while the old title slides out and the new
 * one slides in — up for a later section, down for an earlier one. Each title
 * is laid out at the cap's width and clipped by the box, so neither is
 * truncated mid-resize. The step is committed before the title is swapped:
 * Reanimated reads a view's `exiting` from its last render, so the leaving
 * title must already carry the new direction. Reduce motion: the width snaps
 * and the titles only fade.
 *
 * VoiceOver reads it as "Sections, Pricing, 42 percent, button, collapsed".
 */
export function SectionProgressPill({ labelWidth, onLayout }: SectionProgressPillProps): ReactElement {
	const { accessibilityLabel, accessibilityValue, index, isOpen, label, pillTestID, setOpen, value } =
		useSectionProgressPart("SectionProgress.Pill");
	const { width } = useWindowDimensions();
	const maxWidth = resolveLabelMaxWidth(width);
	const isReducedMotion = useReducedMotion();
	const slots = sectionProgressVariants();

	const toggle = useCallback(() => setOpen(!isOpen), [isOpen, setOpen]);

	const [shown, setShown] = useState({ index, label, value });
	const [step, setStep] = useState<LabelStep>("forward");
	const nextStep = resolveLabelStep(shown.index, index);
	if (shown.value !== value && step !== nextStep) setStep(nextStep);
	useEffect(() => {
		if (shown.value !== value || shown.label !== label) setShown({ index, label, value });
	}, [index, label, shown, value]);

	const entering = useMemo(() => labelEntering(step, isReducedMotion), [step, isReducedMotion]);
	const exiting = useMemo(() => labelExiting(step, isReducedMotion), [step, isReducedMotion]);

	const measure = useCallback(
		(event: TextLayoutEvent) => {
			const next = resolveLabelWidth(event.nativeEvent.lines[0]?.width ?? 0, maxWidth);
			labelWidth.value = labelWidth.value === 0 || isReducedMotion ? next : withTiming(next, RESIZE_TIMING);
		},
		[isReducedMotion, labelWidth, maxWidth]
	);
	const boxStyle = useAnimatedStyle(() => ({ width: labelWidth.value }));

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ expanded: isOpen }}
			accessibilityValue={{ text: accessibilityValue }}
			className={slots.pillRow()}
			feedback="fade"
			onLayout={onLayout}
			onPress={toggle}
			testID={pillTestID}
		>
			<SectionProgressRing />
			<Animated.View className={slots.labelBox()} style={boxStyle}>
				<Animated.View entering={entering} exiting={exiting} key={shown.value ?? ""} style={{ width: maxWidth }}>
					<Text.Label className={slots.label()} numberOfLines={1} onTextLayout={measure}>
						{shown.label}
					</Text.Label>
				</Animated.View>
			</Animated.View>
		</Pressable>
	);
}
SectionProgressPill.displayName = "DelacourUI.SectionProgress.Pill";
