import { OtpInput } from "@delacour/react-native-ui/otp-input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Masked PIN",
	align: "center",
	caption:
		"`isMasked` draws a dot in each filled cell. The mask is visual only — the field is never a secure entry, so autofill and paste keep working.",
	capture: { flow: "otp-input/pin-masked" },
};

export function Demo(): ReactElement {
	return <OtpInput defaultValue="27" isMasked length={4} size="lg" testID="otp-pin" />;
}
