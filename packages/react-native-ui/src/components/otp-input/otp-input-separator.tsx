import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useOtpInputPart } from "./otp-input.context";
import { otpInputVariants } from "./otp-input.variants";

export type OtpInputSeparatorProps = Omit<ViewProps, "children">;

/**
 * A short rule between two groups. Decoration only: the row it sits in is already hidden from
 * assistive technology, and the code is read as one value.
 */
export function OtpInputSeparator({ className, ...props }: OtpInputSeparatorProps): ReactElement {
	useOtpInputPart("OtpInput.Separator");
	return <View className={otpInputVariants().separator({ className })} {...props} />;
}
OtpInputSeparator.displayName = "DelacourUI.OtpInput.Separator";
