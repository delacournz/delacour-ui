import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text as NativeText, TextInput, type TextInputProps, View } from "react-native";
import Animated, {
	Easing,
	type EasingFunction,
	useAnimatedProps,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import type { TextAnimationBase } from "./text-animation.types";
import {
	formatNumber,
	TEXT_ANIMATION_COUNT_DURATION_MS,
	type TextAnimationNumberFormat,
	textAnimationVariants,
} from "./text-animation.variants";
import { useTextAnimationClass } from "./text-animation-unit";

export type TextAnimationCountingEasing = "linear" | "out" | "inOut";

export type TextAnimationCountingProps = TextAnimationBase & {
	/** The number to show. A new value tweens from whatever is on screen now. */
	value: number;
	/** Where the first count starts. Default 0. */
	from?: number;
	/** Grouping, decimals, prefix and suffix. */
	format?: TextAnimationNumberFormat;
	/** The tween, ms. Default 900. */
	durationMs?: number;
	/** Default `out`. */
	easing?: TextAnimationCountingEasing;
	/** `false` shows `value` on mount and only tweens later changes. Default `true`. */
	animateOnMount?: boolean;
};

const EASINGS: Record<TextAnimationCountingEasing, EasingFunction> = {
	linear: Easing.linear,
	out: Easing.out(Easing.cubic),
	inOut: Easing.inOut(Easing.cubic),
};

/** A `TextInput` with the one prop it is never typed with: `text`, which Reanimated can write natively. */
type CountingInputProps = TextInputProps & { text?: string };

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const slots = textAnimationVariants();

/**
 * Spread on every text a numeric part draws. The container's label is the
 * whole reading; an `accessible` container alone did not keep iOS from
 * listing a `TextInput` or a wheel's digits beneath it.
 */
const HIDDEN = {
	accessible: false,
	accessibilityElementsHidden: true,
	importantForAccessibility: "no-hide-descendants",
} as const;

/** Whichever of two formatted numbers is longer — what the slot reserves so no in-flight value clips. */
function longer(a: string, b: string): string {
	return b.length > a.length ? b : a;
}

/**
 * Tweens a formatted number to its value.
 *
 * The digits are written by an animated `text` prop on a read-only
 * `TextInput`, computed on the UI thread by the `formatNumber` worklet every
 * frame — no React render per frame. Hermes worklets have no `Intl`, which is
 * why grouping and decimals are hand-written. An invisible `Text` in flow
 * holds the width of the longer of the start and the target, since the input
 * does not re-measure as its native text changes.
 *
 * A new `value` mid-tween retargets from what is on screen, never from
 * `from`. Under calm motion the value is shown at once — it is information.
 */
export function TextAnimationCounting({
	value,
	from = 0,
	format,
	durationMs = TEXT_ANIMATION_COUNT_DURATION_MS,
	easing = "out",
	animateOnMount = true,
	variant,
	size,
	weight,
	color,
	align,
	transform,
	className,
	allowFontScaling,
	maxFontSizeMultiplier,
	testID,
	nativeID,
	accessibilityHint,
}: TextAnimationCountingProps): ReactElement {
	const isCalm = useCalmMotion();
	const textClass = cn(
		useTextAnimationClass({ variant, size, weight, color, align, transform, className }),
		"tabular-nums"
	);
	// biome-ignore lint/correctness/useExhaustiveDependencies: the format's fields are its identity
	const stableFormat = useMemo<TextAnimationNumberFormat>(() => format ?? {}, [JSON.stringify(format ?? {})]);
	const start = animateOnMount && !isCalm ? from : value;
	const shown = useSharedValue(start);
	const target = formatNumber(value, stableFormat);
	const [reserve, setReserve] = useState(() => longer(formatNumber(start, stableFormat), target));
	const lastRef = useRef(start);

	const settle = useCallback((settled: string) => setReserve(settled), []);

	useEffect(() => {
		const formatted = formatNumber(value, stableFormat);
		if (isCalm) {
			shown.value = value;
			lastRef.current = value;
			setReserve(formatted);
			return;
		}
		setReserve(longer(formatNumber(lastRef.current, stableFormat), formatted));
		lastRef.current = value;
		shown.value = withTiming(value, { duration: durationMs, easing: EASINGS[easing] }, (finished) => {
			if (finished) scheduleOnRN(settle, formatted);
		});
	}, [value, isCalm, durationMs, easing, stableFormat, shown, settle]);

	const animatedProps = useAnimatedProps<CountingInputProps>(() => {
		const text = formatNumber(shown.value, stableFormat);
		return { text, defaultValue: text };
	});

	return (
		<View
			accessibilityHint={accessibilityHint}
			accessibilityLabel={target}
			accessibilityRole="text"
			accessible
			className={slots.number()}
			nativeID={nativeID}
			testID={testID}
		>
			<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
				<NativeText {...HIDDEN} allowFontScaling={allowFontScaling} className={cn(textClass, "opacity-0")}>
					{reserve}
				</NativeText>
				<AnimatedTextInput
					{...HIDDEN}
					allowFontScaling={allowFontScaling}
					animatedProps={animatedProps}
					className={cn(textClass, "absolute inset-0 m-0 p-0")}
					defaultValue={formatNumber(start, stableFormat)}
					editable={false}
					maxFontSizeMultiplier={maxFontSizeMultiplier}
					pointerEvents="none"
					scrollEnabled={false}
					underlineColorAndroid="transparent"
				/>
			</View>
		</View>
	);
}
TextAnimationCounting.displayName = "DelacourUI.TextAnimation.Counting";
