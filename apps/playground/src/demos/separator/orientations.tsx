import { Separator } from "@delacour/native-ui/separator";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Orientations",
	note: "A vertical separator needs a height from somewhere — its parent's, or its own.",
	capture: { align: "stretch", hero: true },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<View className="gap-3">
				<Text.Paragraph>Above</Text.Paragraph>
				<Separator />
				<Text.Paragraph>Below</Text.Paragraph>
			</View>
			<View className="flex-row items-center gap-3">
				<Text.Paragraph>Left</Text.Paragraph>
				<Separator className="h-4" orientation="vertical" />
				<Text.Paragraph>Middle</Text.Paragraph>
				<Separator className="h-4" orientation="vertical" />
				<Text.Paragraph>Right</Text.Paragraph>
			</View>
		</View>
	);
}
