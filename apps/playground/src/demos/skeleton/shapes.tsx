import { SKELETON_SHAPES, Skeleton, type SkeletonShape } from "@delacour/react-native-ui/skeleton";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Shapes",
	caption:
		"`rect` for a card or an image, `line` for a line of text, `circle` for an avatar. Each has a default size that a `className` overrides.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<SkeletonShape, string> = {
	rect: "Rect",
	line: "Line",
	circle: "Circle",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{SKELETON_SHAPES.map((shape) => (
				<View className="gap-2" key={shape}>
					<Text.Caption size="xs">{LABELS[shape]}</Text.Caption>
					<Skeleton shape={shape} testID={`skeleton-${shape}`} />
				</View>
			))}
		</View>
	);
}
