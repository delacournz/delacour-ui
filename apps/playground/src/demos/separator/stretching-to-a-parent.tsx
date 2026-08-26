import { Separator } from "@delacour/native-ui/separator";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Stretching to a parent",
	caption: "In a row the vertical rule takes the row's height with no height of its own.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-stretch rounded-2xl border border-border bg-card">
			<View className="flex-1 gap-1 p-4">
				<Text className="font-semibold text-2xl text-card-foreground">128</Text>
				<Text.Caption>Components</Text.Caption>
			</View>
			<Separator orientation="vertical" />
			<View className="flex-1 gap-1 p-4">
				<Text className="font-semibold text-2xl text-card-foreground">12</Text>
				<Text.Caption>Packages</Text.Caption>
			</View>
		</View>
	);
}
