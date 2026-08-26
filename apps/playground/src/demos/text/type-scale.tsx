import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Type scale",
	capture: { align: "stretch", hero: true },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Text.Display>Display</Text.Display>
			<Text.Title>Title</Text.Title>
			<Text.Header>Header</Text.Header>
			<Text.Subheader>Subheader</Text.Subheader>
			<Text.Paragraph>Paragraph</Text.Paragraph>
			<Text.Label>Label</Text.Label>
			<Text.Caption>Caption</Text.Caption>
			<Text.Overline>Overline</Text.Overline>
		</View>
	);
}
