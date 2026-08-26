import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Nesting",
	caption: "A bare nested Text inherits everything; naming one axis changes only that axis.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Text.Title>
				Total <Text color="muted">USD</Text>
			</Text.Title>
			<Text.Paragraph>
				One <Text>level</Text>, then{" "}
				<Text weight="bold">
					two <Text color="danger">levels</Text>
				</Text>{" "}
				deep.
			</Text.Paragraph>
		</View>
	);
}
