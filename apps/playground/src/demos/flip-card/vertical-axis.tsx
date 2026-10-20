import { FLIP_CARD_AXES, FlipCard, type FlipCardAxis } from "@delacour/react-native-ui/flip-card";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Axis",
	caption:
		'`axis="y"`, the default, swings the card left and right; `axis="x"` tips it top over bottom. On a swipe card the axis also picks the drag direction.',
	capture: { align: "stretch", flow: true },
};

const LABELS: Record<FlipCardAxis, string> = {
	x: "Tips top over bottom",
	y: "Swings left and right",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{FLIP_CARD_AXES.map((axis) => (
				<FlipCard axis={axis} className="h-28" key={axis} testID={`flip-card-axis-${axis}`}>
					<FlipCard.Front className="items-center justify-center">
						<Text.Label>{`axis="${axis}"`}</Text.Label>
						<Text.Caption>{LABELS[axis]}</Text.Caption>
					</FlipCard.Front>
					<FlipCard.Back className="items-center justify-center">
						<Text.Label>The other side</Text.Label>
					</FlipCard.Back>
				</FlipCard>
			))}
		</View>
	);
}
