import { BADGE_SIZES, Badge } from "@delacour/native-ui/badge";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-center gap-2">
			{BADGE_SIZES.map((size) => (
				<Badge color="primary" key={size} size={size}>
					size {size}
				</Badge>
			))}
		</View>
	);
}
