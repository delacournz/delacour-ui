import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Code",
	caption:
		"A nested Text is laid out by the platform's text engine, not by Yoga — padding and rounded corners are ignored on both platforms, so only the standalone form is padded.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Text.Paragraph>
				Run <Text.Code>bun test</Text.Code> before you commit.
			</Text.Paragraph>
			<View className="flex-row">
				<Text.Code>bun run gen-exports</Text.Code>
			</View>
			<View className="rounded-lg bg-muted p-3">
				<Text.Code className="bg-transparent" size="sm">
					bun run typecheck
				</Text.Code>
			</View>
		</View>
	);
}
