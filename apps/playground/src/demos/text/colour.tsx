import { TEXT_COLORS, Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colour",
	caption:
		"Text drawn on a coloured surface is that surface's job, not this axis — the pill below writes the utility directly.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="gap-2">
			{TEXT_COLORS.map((color) => (
				<Text color={color} key={color}>
					color {color}
				</Text>
			))}
			<View className="self-start rounded-full bg-danger px-3 py-1">
				<Text className="font-semibold text-danger-foreground text-xs">on a danger surface</Text>
			</View>
		</View>
	);
}
