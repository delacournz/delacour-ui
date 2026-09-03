import { TEXT_COLORS, Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colour",
	caption:
		"Text drawn on a coloured surface is that surface's job, not this axis — the pill below writes the utility directly.",
	capture: {},
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof TEXT_COLORS)[number], string> = {
	default: "Default",
	muted: "Muted",
	destructive: "Destructive",
	success: "Success",
	warning: "Warning",
	info: "Info",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-2">
			{TEXT_COLORS.map((color) => (
				<Text color={color} key={color}>
					{LABELS[color]}
				</Text>
			))}
			<View className="self-start rounded-full bg-destructive px-3 py-1">
				<Text className="font-semibold text-destructive-foreground text-xs">on a destructive surface</Text>
			</View>
		</View>
	);
}
