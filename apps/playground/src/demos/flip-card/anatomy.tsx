import { FlipCard } from "@delacour/react-native-ui/flip-card";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	caption:
		"`FlipCard.Front` sits in flow and sets the card's size; `FlipCard.Back` fills it. Tap anywhere on the card to turn it — the face is state, and the rotation follows it.",
	capture: { align: "stretch", flow: "flip-card/anatomy", hero: true },
};

export function Demo(): ReactElement {
	return (
		<FlipCard accessibilityLabel="Travel card" className="aspect-[1.586]" testID="flip-card">
			<FlipCard.Front className="justify-between">
				<Text.Overline>Travel card</Text.Overline>
				<View className="gap-1">
					<Text.Title>Aria Whitlock</Text.Title>
					<Text.Caption>Tap to see the number</Text.Caption>
				</View>
			</FlipCard.Front>
			<FlipCard.Back className="justify-between">
				<Text.Overline>Card number</Text.Overline>
				<Text.Header className="tabular-nums">4012 8888 8888 1881</Text.Header>
				<View className="flex-row justify-between">
					<Text.Caption>Expires 09/29</Text.Caption>
					<Text.Caption>CVC 123</Text.Caption>
				</View>
			</FlipCard.Back>
		</FlipCard>
	);
}
