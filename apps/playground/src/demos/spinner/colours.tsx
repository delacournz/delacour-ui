import { SPINNER_COLORS, Spinner } from "@delacour/native-ui/spinner";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	align: "center",
	caption: "Named colours, a theme token and a literal hex. All four should survive a theme switch.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-center gap-6">
			{SPINNER_COLORS.map((color) => (
				<View className="items-center gap-2" key={color}>
					<Spinner color={color} size="lg" />
					<Text.Caption size="xs">{color}</Text.Caption>
				</View>
			))}
			<View className="items-center gap-2">
				<Spinner color="info" size="lg" />
				<Text.Caption size="xs">info</Text.Caption>
			</View>
			<View className="items-center gap-2">
				<Spinner color="#EC4899" size="lg" />
				<Text.Caption size="xs">#EC4899</Text.Caption>
			</View>
		</View>
	);
}
