import type { ReactElement } from "react";
import { View } from "react-native";
import { Text } from "../text";
import type { TextVariant } from "../text/text.variants";
import {
	COUNTDOWN_MAX_FONT_SIZE_MULTIPLIER,
	type CountdownSize,
	countdownDigits,
	countdownVariants,
} from "./countdown.variants";
import { CountdownDigit } from "./countdown-digit";

export type CountdownSegmentProps = {
	value: number;
	/** The unit's caption beneath the digits. */
	label: string;
	size: CountdownSize;
	isUrgent: boolean;
	isAnimated: boolean;
	variant: TextVariant;
};

/**
 * One unit of a segmented countdown: a muted box of digit columns over its caption.
 *
 * Columns are keyed by their place counted from the right, so the ones column stays the ones
 * column when an absorbing unit gains or loses a digit, and only the digits that changed slide.
 */
export function CountdownSegment({
	value,
	label,
	size,
	isUrgent,
	isAnimated,
	variant,
}: CountdownSegmentProps): ReactElement {
	const slots = countdownVariants({ isUrgent, size, variant: "segmented" });
	const digits = countdownDigits(value);
	const digitClassName = slots.digit();
	const valueClassName = slots.value();

	return (
		<View className={slots.segment()}>
			<View className={slots.digits()}>
				{digits.map((digit, index) => (
					<CountdownDigit
						className={digitClassName}
						digit={digit}
						isAnimated={isAnimated}
						key={digits.length - index}
						valueClassName={valueClassName}
						variant={variant}
					/>
				))}
			</View>
			<Text className={slots.caption()} maxFontSizeMultiplier={COUNTDOWN_MAX_FONT_SIZE_MULTIPLIER} variant="caption">
				{label}
			</Text>
		</View>
	);
}
CountdownSegment.displayName = "DelacourUI.Countdown.Segment";
