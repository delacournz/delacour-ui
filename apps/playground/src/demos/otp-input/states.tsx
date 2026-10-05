import { OtpInput } from "@delacour/react-native-ui/otp-input";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "States",
	align: "center",
	note: "Filled, invalid and disabled. Invalid paints every cell destructive and stays that way while focused; disabled fades the whole row and takes no input.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			<View className="items-center gap-1.5">
				<Text.Caption color="muted">Placeholder</Text.Caption>
				<OtpInput length={4} placeholder="○" testID="otp-placeholder" />
			</View>
			<View className="items-center gap-1.5">
				<Text.Caption color="muted">Filled</Text.Caption>
				<OtpInput defaultValue="4821" length={4} testID="otp-filled" />
			</View>
			<View className="items-center gap-1.5">
				<Text.Caption color="muted">Invalid</Text.Caption>
				<OtpInput defaultValue="4829" isInvalid length={4} testID="otp-invalid" />
			</View>
			<View className="items-center gap-1.5">
				<Text.Caption color="muted">Disabled</Text.Caption>
				<OtpInput defaultValue="48" isDisabled length={4} testID="otp-disabled" />
			</View>
		</View>
	);
}
