import { type ReactElement, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { LayoutAnimationConfig } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import {
	COUNTDOWN_DEFAULT_LABELS,
	COUNTDOWN_DEFAULT_SIZE,
	COUNTDOWN_DEFAULT_VARIANT,
	COUNTDOWN_DIGIT_TEXT_VARIANT,
	type CountdownSize,
	type CountdownUnit,
	type CountdownVariant,
	countdownVariants,
	formatCountdownInline,
	isCountdownUrgent,
	resolveCountdownAccessibilityLabel,
	resolveCountdownUnits,
	splitCountdown,
	trimCountdownUnits,
} from "./countdown.variants";
import { CountdownSegment } from "./countdown-segment";
import { useCountdownClock } from "./use-countdown-clock";

export type CountdownProps = Omit<ViewProps, "children"> & {
	/** The moment it counts down to — a `Date`, or epoch milliseconds. */
	to: Date | number;
	/** Which units to show, in any order. Defaults to all four. The largest absorbs everything above it. */
	units?: readonly CountdownUnit[];
	/** Drop leading units that read zero, never below the smallest two selected. Defaults to `true`. */
	trim?: boolean;
	/** Captions under the segmented boxes, and the unit names a screen reader hears. */
	labels?: Partial<Record<CountdownUnit, string>>;
	/** At or below this many seconds left, the digits turn destructive. */
	urgentBelow?: number;
	variant?: CountdownVariant;
	size?: CountdownSize;
	/** The wall clock, in epoch milliseconds. For tests and demos; defaults to `Date.now`. */
	now?: () => number;
	/** Called with the seconds left whenever they change, including on mount. */
	onTick?: (secondsLeft: number) => void;
	/** Called once when time is up. A new `to` in the future arms it again. */
	onComplete?: () => void;
	className?: string;
};

function CountdownRoot({
	to,
	units: rawUnits,
	trim = true,
	labels,
	urgentBelow,
	variant = COUNTDOWN_DEFAULT_VARIANT,
	size = COUNTDOWN_DEFAULT_SIZE,
	now,
	onTick,
	onComplete,
	className,
	accessibilityLabel,
	...props
}: CountdownProps): ReactElement {
	const seconds = useCountdownClock({ now, onComplete, onTick, to });
	const isCalm = useCalmMotion();

	const units = useMemo(() => resolveCountdownUnits(rawUnits), [rawUnits]);
	const parts = splitCountdown(seconds, units);
	const visible = trimCountdownUnits(parts, units, trim);
	const isUrgent = isCountdownUrgent(seconds, urgentBelow);
	const textVariant = COUNTDOWN_DIGIT_TEXT_VARIANT[size];
	const slots = countdownVariants({ isUrgent, size, variant });

	const spoken = useMemo(() => resolveCountdownAccessibilityLabel(seconds, units, labels), [seconds, units, labels]);

	// One accessible element: the role and the coarse label live on the root, and the digits
	// beneath are hidden so a screen reader never walks them one by one. The label changes at
	// most once a minute until the final minute, so the polite live region does not chatter.
	// `skipEntering` keeps the first render still; after that only a changed digit slides.
	return (
		<View
			accessibilityLabel={accessibilityLabel ?? spoken}
			accessibilityLiveRegion="polite"
			accessibilityRole="timer"
			accessible
			className={cn(slots.root(), className)}
			{...props}
		>
			<LayoutAnimationConfig skipEntering>
				{variant === "inline" ? (
					<Text className={slots.value()} importantForAccessibility="no-hide-descendants" variant={textVariant}>
						{formatCountdownInline(parts, visible)}
					</Text>
				) : (
					<View className={slots.root()} importantForAccessibility="no-hide-descendants">
						{visible.map((unit) => (
							<CountdownSegment
								isAnimated={!isCalm}
								isUrgent={isUrgent}
								key={unit}
								label={labels?.[unit] ?? COUNTDOWN_DEFAULT_LABELS[unit]}
								size={size}
								value={parts[unit]}
								variant={textVariant}
							/>
						))}
					</View>
				)}
			</LayoutAnimationConfig>
		</View>
	);
}

/**
 * Time left until a fixed moment — a sale ending, a launch, a booking hold.
 *
 * **It reads the wall clock on every tick** rather than counting down a number, so it is right
 * after the app was backgrounded, the JavaScript thread stalled or the device slept. Seconds round
 * up: the final second reads `0:01`, and `0:00` appears only when time is up, which is also when
 * `onComplete` fires — once per `to`.
 *
 * `units` picks what to show; the largest absorbs everything above it, so hours and minutes show
 * 48 h for two days. `trim` drops leading zero units. `urgentBelow` turns the digits destructive.
 *
 * `segmented` draws each unit as a muted box with its caption beneath, and slides a changed digit
 * in from above; `inline` is one run of text — `2d 14:03:22`.
 *
 * It is one accessible element with the `timer` role and a coarse label — days, hours and minutes,
 * then seconds only in the final minute — so a screen reader is not told every second.
 *
 * @example
 * <Countdown to={endsAt} />
 *
 * @example
 * <Countdown to={endsAt} variant="inline" size="sm" />
 *
 * @example
 * <Countdown to={endsAt} units={["hours", "minutes", "seconds"]} urgentBelow={60} onComplete={expire} />
 */
export const Countdown = Object.assign(CountdownRoot, {
	displayName: "DelacourUI.Countdown",
});
