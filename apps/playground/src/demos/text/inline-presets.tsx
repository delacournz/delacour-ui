import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inline presets",
	caption:
		"An inline preset emits only its delta, so it takes the size and colour of the text around it. Standing alone it falls back to the base treatment — React Native's own default colour does not follow the theme.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Text.Title>
				Nested in a title: <Text.Strong>strong</Text.Strong>, <Text.Emphasis>emphasis</Text.Emphasis>,{" "}
				<Text.Link>link</Text.Link>, <Text.Code>code</Text.Code>.
			</Text.Title>
			<View className="flex-row flex-wrap items-center gap-3">
				<Text.Strong>strong</Text.Strong>
				<Text.Emphasis>emphasis</Text.Emphasis>
				<Text.Link>link</Text.Link>
				<Text.Code>code</Text.Code>
			</View>
		</View>
	);
}
