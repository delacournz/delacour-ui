import { Pressable } from "delacour-react-native-ui/pressable";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "asChild",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<Pressable asChild haptic="medium" testID="composed-card">
			<View className="gap-1 rounded-xl border border-border bg-card p-4">
				<Text className="font-semibold text-card-foreground text-lg">Composed card</Text>
				<Text.Caption>Pressable renders into this View — no extra wrapper in the tree.</Text.Caption>
			</View>
		</Pressable>
	);
}
