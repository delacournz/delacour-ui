import { OtpInput } from "@delacour/react-native-ui/otp-input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Letters and digits",
	align: "center",
	caption:
		'`pattern="alphanumeric"` brings up the full keyboard and uppercases as you type. A dash or a space in a pasted code is dropped rather than refused.',
	capture: {},
};

export function Demo(): ReactElement {
	return <OtpInput defaultValue="K7Q" groupSize={4} length={8} pattern="alphanumeric" size="sm" testID="otp-alnum" />;
}
