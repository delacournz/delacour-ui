import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, Text as NativeText, View } from "react-native";
import Animated, {
	Easing,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import type { TextAnimationBase } from "./text-animation.types";
import {
	formatNumber,
	type RollDirection,
	resolveNumberCells,
	resolveNumberFormat,
	resolveRollDirection,
	resolveRollTarget,
	resolveWheelOffset,
	TEXT_ANIMATION_ROLL_DURATION_MS,
	TEXT_ANIMATION_ROLL_STAGGER,
	type TextAnimationNumberFormat,
	textAnimationVariants,
} from "./text-animation.variants";
import { useTextAnimationClass } from "./text-animation-unit";

export type TextAnimationRollingProps = TextAnimationBase & {
	/** The number to show. Each digit rolls to its new value. */
	value: number;
	/** Grouping, decimals, prefix and suffix. Separators render static; only digits roll. */
	format?: TextAnimationNumberFormat;
	/** Text before the number, after any sign — `−$5`. Never rolls or tweens. Wins over `format.prefix`. */
	prefix?: string;
	/** Text after the number — `%`, ` kg`, `/100`. Never rolls or tweens. Wins over `format.suffix`. */
	suffix?: string;
	/** One wheel's roll, ms. Default 600. */
	durationMs?: number;
	/** Delay between wheels, least significant first, ms. Default 40. */
	stagger?: number;
};

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

/** The strip inside a wheel: 0–9, then 0 again so 9 rolls on into a zero. */
const COLUMN = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const;

type WheelProps = {
	digit: number;
	direction: RollDirection;
	/** This wheel's place counted from the right, among digits — what its stagger is scaled by. */
	rank: number;
	/** Mounted after the first render — a new leading digit — so it rolls up from 0. */
	isLate: boolean;
	isCalm: boolean;
	durationMs: number;
	stagger: number;
	lineHeight: SharedValue<number>;
	className: string;
	allowFontScaling?: boolean;
	maxFontSizeMultiplier?: number;
};

/**
 * One odometer digit: a window one line tall over a 0–9 strip.
 *
 * The position is cumulative rather than 0–9, so a 9 → 0 on the way up rolls
 * forward through the wrap. The window is sized by an invisible digit in
 * flow, and the strip is offset by the line height that digit measured — so
 * the wheel follows font scaling rather than a fixed height.
 */
function TextAnimationWheel({
	digit,
	direction,
	rank,
	isLate,
	isCalm,
	durationMs,
	stagger,
	lineHeight,
	className,
	allowFontScaling,
	maxFontSizeMultiplier,
}: WheelProps): ReactElement {
	const initial = isLate && !isCalm ? 0 : digit;
	const position = useSharedValue(initial);
	const targetRef = useRef(initial);

	useEffect(() => {
		const target = resolveRollTarget(targetRef.current, digit, direction);
		if (target === targetRef.current) return;
		targetRef.current = target;
		if (isCalm) {
			position.value = target;
			return;
		}
		position.value = withDelay(
			rank * stagger,
			withTiming(target, { duration: durationMs, easing: Easing.out(Easing.cubic) })
		);
	}, [digit, direction, rank, isCalm, durationMs, stagger, position]);

	const columnStyle = useAnimatedStyle(() => ({
		opacity: lineHeight.value > 0 ? 1 : 0,
		transform: [{ translateY: -resolveWheelOffset(position.value) * lineHeight.value }],
	}));
	const textProps = { allowFontScaling, maxFontSizeMultiplier, className };

	return (
		<View className={slots.wheel()}>
			<NativeText {...HIDDEN} {...textProps} className={cn(className, "opacity-0")}>
				0
			</NativeText>
			<Animated.View className={slots.column()} style={columnStyle}>
				{COLUMN.map((entry, i) => (
					<NativeText {...HIDDEN} {...textProps} key={`${i}-${entry}`}>
						{entry}
					</NativeText>
				))}
			</Animated.View>
		</View>
	);
}
TextAnimationWheel.displayName = "DelacourUI.TextAnimation.Wheel";

/**
 * An odometer: each digit is a wheel that rolls to its new digit.
 *
 * Wheels are keyed by their place from the right, so 999 → 1000 keeps the
 * three wheels it had and mounts a fourth, which rolls up from 0. Separators
 * and the sign are static cells; the prefix and the suffix are one static cell
 * each, so a digit inside one never rolls. Every glyph is set in
 * tabular figures, so no digit is wider than another and nothing jitters
 * sideways mid-roll. Under calm motion each wheel lands at once.
 */
export function TextAnimationRolling({
	value,
	format,
	prefix,
	suffix,
	durationMs = TEXT_ANIMATION_ROLL_DURATION_MS,
	stagger = TEXT_ANIMATION_ROLL_STAGGER,
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
}: TextAnimationRollingProps): ReactElement {
	const isCalm = useCalmMotion();
	const textClass = cn(
		useTextAnimationClass({ variant, size, weight, color, align, transform, className }),
		"tabular-nums"
	);
	// biome-ignore lint/correctness/useExhaustiveDependencies: the format's fields are its identity
	const resolvedFormat = useMemo(
		() => resolveNumberFormat(format, prefix, suffix),
		[JSON.stringify(format ?? {}), prefix, suffix]
	);
	const formatted = useMemo(() => formatNumber(value, resolvedFormat), [value, resolvedFormat]);
	const cells = useMemo(() => resolveNumberCells(value, resolvedFormat), [value, resolvedFormat]);

	const [direction, setDirection] = useState<{ value: number; direction: RollDirection }>({
		value,
		direction: "up",
	});
	const current = direction.value === value ? direction.direction : resolveRollDirection(direction.value, value);
	useEffect(() => {
		setDirection((previous) =>
			previous.value === value ? previous : { value, direction: resolveRollDirection(previous.value, value) }
		);
	}, [value]);

	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => setHasMounted(true), []);

	const lineHeight = useSharedValue(0);
	const onLayout = (event: LayoutChangeEvent) => {
		lineHeight.value = event.nativeEvent.layout.height;
	};

	const keyed = useMemo(() => {
		let digitRank = 0;
		let staticRank = 0;
		return [...cells]
			.reverse()
			.map((cell) => {
				if (cell.kind === "digit") {
					const entry = { cell, key: `d${digitRank}`, rank: digitRank };
					digitRank += 1;
					return entry;
				}
				const entry = { cell, key: `s${staticRank}`, rank: staticRank };
				staticRank += 1;
				return entry;
			})
			.reverse();
	}, [cells]);

	// One static digit measures the line height every wheel offsets by.
	return (
		<View
			accessibilityHint={accessibilityHint}
			accessibilityLabel={formatted}
			accessibilityRole="text"
			accessible
			className={slots.number()}
			nativeID={nativeID}
			testID={testID}
		>
			<View accessibilityElementsHidden className={slots.number()} importantForAccessibility="no-hide-descendants">
				<NativeText
					{...HIDDEN}
					allowFontScaling={allowFontScaling}
					className={cn(textClass, slots.layer(), "opacity-0")}
					maxFontSizeMultiplier={maxFontSizeMultiplier}
					onLayout={onLayout}
				>
					0
				</NativeText>
				{keyed.map(({ cell, key, rank }) =>
					cell.kind === "digit" ? (
						<TextAnimationWheel
							allowFontScaling={allowFontScaling}
							className={textClass}
							digit={cell.digit}
							direction={current}
							durationMs={durationMs}
							isCalm={isCalm}
							isLate={hasMounted}
							key={key}
							lineHeight={lineHeight}
							maxFontSizeMultiplier={maxFontSizeMultiplier}
							rank={rank}
							stagger={stagger}
						/>
					) : (
						<NativeText
							{...HIDDEN}
							allowFontScaling={allowFontScaling}
							className={textClass}
							key={key}
							maxFontSizeMultiplier={maxFontSizeMultiplier}
						>
							{cell.text}
						</NativeText>
					)
				)}
			</View>
		</View>
	);
}
TextAnimationRolling.displayName = "DelacourUI.TextAnimation.Rolling";
