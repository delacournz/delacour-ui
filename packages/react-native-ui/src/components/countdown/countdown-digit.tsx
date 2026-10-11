import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { Text } from "../text";
import type { TextVariant } from "../text/text.variants";
import { COUNTDOWN_DIGIT_SLIDE_MS, COUNTDOWN_MAX_FONT_SIZE_MULTIPLIER } from "./countdown.variants";

const ENTERING = FadeInDown.duration(COUNTDOWN_DIGIT_SLIDE_MS);
const EXITING = FadeOutDown.duration(COUNTDOWN_DIGIT_SLIDE_MS);

export type CountdownDigitProps = {
	/** One character, `0`–`9`. */
	digit: string;
	/** Whether a change slides. Off under reduce motion and `isMotionCalm`. */
	isAnimated: boolean;
	variant: TextVariant;
	/** The column's class — `countdownVariants().digit()`. */
	className: string;
	/** The digit text's class — `countdownVariants().value()`. */
	valueClassName: string;
};

/**
 * One digit column of a segmented box.
 *
 * The digit is keyed by its own value, so a change unmounts the old one — which slides down and
 * fades out — and mounts the new one, which enters from above. An unchanged digit keeps its key
 * and never moves. The column clips both, so the slide stays inside its slot.
 */
export function CountdownDigit({
	digit,
	isAnimated,
	variant,
	className,
	valueClassName,
}: CountdownDigitProps): ReactElement {
	return (
		<View className={className}>
			<Animated.View
				entering={isAnimated ? ENTERING : undefined}
				exiting={isAnimated ? EXITING : undefined}
				key={digit}
			>
				<Text className={valueClassName} maxFontSizeMultiplier={COUNTDOWN_MAX_FONT_SIZE_MULTIPLIER} variant={variant}>
					{digit}
				</Text>
			</Animated.View>
		</View>
	);
}
CountdownDigit.displayName = "DelacourUI.Countdown.Digit";
