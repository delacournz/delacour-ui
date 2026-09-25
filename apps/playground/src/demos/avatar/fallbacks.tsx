import { Avatar } from "@delacour/react-native-ui/avatar";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Image and fallbacks",
	align: "center",
	caption:
		"A photo; initials from `name`; `fallback` overriding the drawn text; a person glyph when there is nothing to draw; and a dead URL, which falls back to the initials instead of an empty circle.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-center gap-3">
			<Avatar name="Kate Austen" source={{ uri: "https://i.pravatar.cc/160?img=47" }} testID="avatar-photo" />
			<Avatar name="Oliver Lee" testID="avatar-initials" />
			<Avatar fallback="DX" name="Design Crew" testID="avatar-fallback" />
			<Avatar testID="avatar-glyph" />
			<Avatar name="Mary Jane Watson" source={{ uri: "https://invalid.example/avatar.png" }} testID="avatar-broken" />
		</View>
	);
}
