export { OtpInput, type OtpInputProps, type OtpInputRef } from "./otp-input";
export {
	type OtpInputContextValue,
	OtpInputProvider,
	useOtpInput,
	useOtpInputContext,
} from "./otp-input.context";
export {
	buildLayout,
	charMatches,
	clampOtpLength,
	maskChar,
	OTP_DEFAULT_LABEL,
	OTP_DEFAULT_LENGTH,
	OTP_MASK_CHAR,
	OTP_MAX_LENGTH,
	OTP_MIN_LENGTH,
	type OtpAutofill,
	type OtpKeyboard,
	type OtpPattern,
	type OtpSlotState,
	type OtpStateAxes,
	resolveAccessibilityHint,
	resolveAccessibilityLabel,
	resolveAccessibilityValue,
	resolveActiveIndex,
	resolveAutofill,
	resolveKeyboard,
	resolveOtpAxes,
	resolveSlotState,
	resolveUppercase,
	type SanitizeOtpOptions,
	sanitizeOtp,
	shouldFireComplete,
} from "./otp-input.logic";
export {
	OTP_CARET_BLINK,
	OTP_DEFAULT_SIZE,
	OTP_DEFAULT_VARIANT,
	OTP_MAX_FONT_SCALE,
	type OtpInputVariantProps,
	type OtpSlotClasses,
	otpInputVariants,
	resolveOtpSlotClasses,
} from "./otp-input.variants";
export type { OtpInputGroupProps } from "./otp-input-group";
export type { OtpInputSeparatorProps } from "./otp-input-separator";
export type { OtpInputSlotProps } from "./otp-input-slot";
