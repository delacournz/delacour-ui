import { BADGE_COLORS, BADGE_SIZES, Badge } from "@delacour/react-native-ui/badge";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dots",
	align: "center",
	note: "A badge with no children and no count is a dot, solid in its colour whatever the variant.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			<View className="flex-row items-center gap-3">
				{BADGE_COLORS.map((color) => (
					<Badge color={color} key={color} />
				))}
			</View>
			<View className="flex-row items-center gap-3">
				{BADGE_SIZES.map((size) => (
					<Badge color="success" key={size} size={size} />
				))}
			</View>
		</View>
	);
}
