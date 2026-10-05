import { AnimatedBadge } from "@delacour/react-native-ui/animated-badge";
import { IconSparkle } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom icon",
	align: "center",
	note: "A custom icon takes the badge's icon size and colour. `showIcon={false}` drops the glyph.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-center gap-2">
			<AnimatedBadge announce={false} icon={IconSparkle} status="info">
				Suggested
			</AnimatedBadge>
			<AnimatedBadge announce={false} showIcon={false} status="warning">
				Draft
			</AnimatedBadge>
		</View>
	);
}
