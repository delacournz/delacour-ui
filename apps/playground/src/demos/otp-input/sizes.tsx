import { INPUT_SIZES, type InputSize } from "@delacour/react-native-ui/input";
import { OtpInput } from "@delacour/react-native-ui/otp-input";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	align: "center",
	note: "A cell is an Input box cut square — 36, 44 and 52 points, on the same tokens as a text field, so the two sit level.",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<InputSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			{INPUT_SIZES.map((size) => (
				<View className="items-center gap-1.5" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<OtpInput defaultValue="12" length={4} size={size} testID={`otp-${size}`} />
				</View>
			))}
		</View>
	);
}
