import { SlideButton } from "@delacour/react-native-ui/slide-button";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Slide to ship",
	caption:
		"Drag the handle across the rail to confirm. The handle tracks the finger exactly; a release short of the threshold springs it home, and one past it confirms with a tick.",
	align: "center",
};

export function Demo(): ReactElement {
	const [shipped, setShipped] = useState(0);

	return (
		<View className="items-center gap-4">
			<SlideButton
				accessibilityActionLabel="Ship order"
				isAutoReset
				autoResetDelay={1500}
				onComplete={() => setShipped((count) => count + 1)}
				testID="slide-to-ship"
			>
				<SlideButton.Label>Slide to ship</SlideButton.Label>
			</SlideButton>
			<Text.Code>{`shipped: ${shipped}`}</Text.Code>
		</View>
	);
}
