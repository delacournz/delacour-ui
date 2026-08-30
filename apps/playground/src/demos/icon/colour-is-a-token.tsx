import { Icon } from "@delacour/native-ui/icon";
import { IconHeart } from "@delacour/native-ui/icons/central";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colour is a token",
	align: "center",
	caption:
		"An icon's size is a class; an icon's colour is a token. A class cannot express a literal like `#EC4899` or reach an SVG paint prop, so `color` is resolved through the active theme instead — a token name, a CSS variable name, or a literal. All seven should survive a theme switch.",
	capture: {},
};

const COLORS = ["foreground", "muted-foreground", "primary", "success", "warning", "danger", "#EC4899"] as const;

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-center gap-5">
			{COLORS.map((color) => (
				<View className="items-center gap-2" key={color}>
					<Icon color={color} icon={IconHeart} size="xl" />
					<Text.Caption size="xs">{color}</Text.Caption>
				</View>
			))}
		</View>
	);
}
