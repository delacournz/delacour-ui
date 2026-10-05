import { Button } from "@delacour/react-native-ui/button";
import { ProgressButton } from "@delacour/react-native-ui/progress-button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Rounded",
	caption:
		'`shape="rounded"` trades the capsule for the card\'s corner, so the button sits square with a rounded `Button` beside it.',
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<View className="w-72 flex-row gap-3">
			<Button className="flex-1 rounded-lg" testID="shape-cancel" variant="outline">
				Cancel
			</Button>
			<ProgressButton className="flex-1" isAutoReset shape="rounded" testID="shape-rounded" variant="success">
				Hold to send
			</ProgressButton>
		</View>
	);
}
