import { SKELETON_ANIMATIONS, Skeleton, type SkeletonAnimation } from "@delacour/react-native-ui/skeleton";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Animations",
	caption:
		"`shimmer` sweeps a glint across the shape, `pulse` breathes its opacity, `none` holds it still. Under the OS reduce-motion setting every one of them holds still.",
	capture: { align: "stretch", flow: "skeleton/animations" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<SkeletonAnimation, string> = {
	shimmer: "Shimmer",
	pulse: "Pulse",
	none: "None",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{SKELETON_ANIMATIONS.map((animation) => (
				<View className="flex-row items-center gap-3" key={animation}>
					<Skeleton animation={animation} shape="circle" />
					<View className="flex-1 gap-2">
						<Text.Caption size="xs">{LABELS[animation]}</Text.Caption>
						<Skeleton animation={animation} className="w-3/4" shape="line" testID={`skeleton-${animation}`} />
					</View>
				</View>
			))}
		</View>
	);
}
