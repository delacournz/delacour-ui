import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useOtpInputPart } from "./otp-input.context";
import { otpInputVariants } from "./otp-input.variants";

export type OtpInputGroupProps = ViewProps;

/**
 * A row of cells, spaced at the field's own gap. The default anatomy draws one per `groupSize`; a
 * custom anatomy writes them out.
 */
export function OtpInputGroup({ className, ...props }: OtpInputGroupProps): ReactElement {
	const { size } = useOtpInputPart("OtpInput.Group");
	return <View className={otpInputVariants({ size }).group({ className })} {...props} />;
}
OtpInputGroup.displayName = "DelacourUI.OtpInput.Group";
