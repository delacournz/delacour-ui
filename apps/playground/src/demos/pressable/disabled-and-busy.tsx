import { Pressable } from "delacour-react-native-ui/pressable";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled and busy",
	caption:
		"Both block the gesture; only `disabled` announces the control as disabled. Neither applies any opacity — that is the caller's job.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Pressable className="rounded-xl bg-secondary p-4 opacity-50" disabled testID="disabled-target">
				<Text className="text-base text-secondary-foreground">disabled</Text>
			</Pressable>
			<Pressable busy className="rounded-xl bg-secondary p-4" testID="busy-target">
				<Text className="text-base text-secondary-foreground">busy</Text>
			</Pressable>
		</View>
	);
}
