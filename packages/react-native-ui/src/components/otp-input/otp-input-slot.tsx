import { type ReactElement, useEffect } from "react";
import { Text, View, type ViewProps } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { useOtpInputPart } from "./otp-input.context";
import { maskChar } from "./otp-input.logic";
import { OTP_CARET_BLINK, OTP_MAX_FONT_SCALE, resolveOtpSlotClasses } from "./otp-input.variants";

export type OtpInputSlotProps = Omit<ViewProps, "children"> & {
	/** Which character of the code this cell draws, from zero. */
	index: number;
};

/**
 * The drawn caret in the active, empty cell.
 *
 * A decorative loop, so it asks `useCalmMotion` and holds still — solid, not hidden — under the OS
 * reduce-motion setting or an E2E build's `isMotionCalm`. A caret that vanished would leave nothing
 * saying where the next character lands.
 *
 * Mounted per cell, so it restarts visible every time the caret moves: a caret that happened to be
 * mid-fade when a digit landed would look like the keystroke had been dropped.
 *
 * The timings set `ReduceMotion.Never`, and so does the repeat: reduce motion is honoured one level
 * up, where the loop is never started. Left at `System`, a timing completes instantly and
 * `withRepeat(-1)` spins a zero-length animation forever.
 */
function OtpInputCaret({ className }: { className: string }): ReactElement {
	const isCalm = useCalmMotion();
	const opacity = useSharedValue(1);

	useEffect(() => {
		if (isCalm) {
			cancelAnimation(opacity);
			opacity.value = 1;
			return;
		}
		const fade = {
			duration: OTP_CARET_BLINK.fadeMs,
			easing: Easing.inOut(Easing.ease),
			reduceMotion: ReduceMotion.Never,
		};
		opacity.value = 1;
		opacity.value = withRepeat(
			withSequence(
				withDelay(OTP_CARET_BLINK.holdMs, withTiming(0, fade), ReduceMotion.Never),
				withDelay(OTP_CARET_BLINK.holdMs, withTiming(1, fade), ReduceMotion.Never)
			),
			-1,
			false,
			undefined,
			ReduceMotion.Never
		);
		return () => cancelAnimation(opacity);
	}, [isCalm, opacity]);

	const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return <Animated.View className={className} style={style} />;
}
OtpInputCaret.displayName = "DelacourUI.OtpInput.Slot.Caret";

/**
 * One cell: its character (or the mask, or the placeholder) and, while it is the active empty cell,
 * the blinking caret.
 *
 * A cell is drawing only. It takes no touch and is not an accessible element — the row it sits in
 * is hidden from both, and the one `TextInput` laid over the row is what is focused and read.
 */
export function OtpInputSlot({ index, className, ...props }: OtpInputSlotProps): ReactElement {
	const { slot, size, variant, isInvalid, isMasked, placeholder } = useOtpInputPart("OtpInput.Slot");
	const state = slot(index);
	const classes = resolveOtpSlotClasses({
		className,
		isActive: state.isActive,
		isFilled: state.isFilled,
		isInvalid,
		size,
		variant,
	});

	// A filled cell shows its character or the mask; an empty one shows the caret when it is the
	// active cell, and the placeholder otherwise. The caret and the placeholder never share a cell.
	let content: ReactElement | null = null;
	if (state.isFilled) {
		content = (
			<Text maxFontSizeMultiplier={OTP_MAX_FONT_SCALE} className={classes.char}>
				{maskChar(state.char, isMasked)}
			</Text>
		);
	} else if (state.isCaret) {
		content = <OtpInputCaret className={classes.caret} />;
	} else if (placeholder) {
		content = (
			<Text maxFontSizeMultiplier={OTP_MAX_FONT_SCALE} className={classes.placeholder}>
				{placeholder}
			</Text>
		);
	}

	return (
		<View className={classes.slot} {...props}>
			{content}
		</View>
	);
}
OtpInputSlot.displayName = "DelacourUI.OtpInput.Slot";
