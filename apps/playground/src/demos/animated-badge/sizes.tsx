import { ANIMATED_BADGE_SIZES, AnimatedBadge, type AnimatedBadgeSize } from "@delacour/react-native-ui/animated-badge";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	align: "center",
	note: "The same padding, type and icon step as a Badge of the same size, so the two sit level.",
	capture: {},
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<AnimatedBadgeSize, string> = {
	sm: "Small",
	md: "Medium",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-center gap-2">
			{ANIMATED_BADGE_SIZES.map((size) => (
				<AnimatedBadge announce={false} key={size} size={size} status="success">
					{LABELS[size]}
				</AnimatedBadge>
			))}
		</View>
	);
}
