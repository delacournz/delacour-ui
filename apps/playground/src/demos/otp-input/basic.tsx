import { OtpInput } from "@delacour/react-native-ui/otp-input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	align: "center",
	caption:
		"Six digits in two groups of three, drawn over one hidden field — so the number pad, a paste and a code autofilled from Messages all fill every cell at once. Autofill needs a real SMS; paste works on the Simulator.",
	capture: { hero: true },
};

export function Demo(): ReactElement {
	return <OtpInput groupSize={3} testID="otp-basic" />;
}
