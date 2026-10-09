import { SlideButton } from "@delacour/react-native-ui/slide-button";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Threshold",
	caption:
		"`threshold` is how far a release must reach. At `0.5` half the rail will do; at `1` there is no shortcut, and only a release at the far end confirms.",
	align: "center",
	capture: { flow: "slide-button/threshold" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<View className="gap-2">
				<Text.Code>threshold: 0.5</Text.Code>
				<SlideButton isAutoReset testID="threshold-half" threshold={0.5}>
					<SlideButton.Label>Slide to send</SlideButton.Label>
					<SlideButton.Thumb testID="threshold-half-thumb" />
				</SlideButton>
			</View>
			<View className="gap-2">
				<Text.Code>threshold: 1</Text.Code>
				<SlideButton
					accessibilityActionLabel="Delete account"
					isAutoReset
					testID="threshold-full"
					threshold={1}
					variant="destructive"
				>
					<SlideButton.Label>Slide to delete</SlideButton.Label>
					<SlideButton.Thumb testID="threshold-full-thumb" />
				</SlideButton>
			</View>
		</View>
	);
}
