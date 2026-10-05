import { FlipCard, type FlipCardFace } from "@delacour/react-native-ui/flip-card";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"`face` and `onFaceChange`, driven from a `Switch` outside the card. A tap on the card asks; the parent decides. With the lock on, the parent refuses and the card springs back.",
};

export function Demo(): ReactElement {
	const [face, setFace] = useState<FlipCardFace>("front");
	const [isLocked, setLocked] = useState(false);

	return (
		<View className="gap-4">
			<FlipCard
				className="h-36"
				face={face}
				onFaceChange={(next) => {
					if (!isLocked) setFace(next);
				}}
				testID="flip-card-controlled"
			>
				<FlipCard.Front className="items-center justify-center">
					<Text.Title>Front</Text.Title>
				</FlipCard.Front>
				<FlipCard.Back className="items-center justify-center">
					<Text.Title>Back</Text.Title>
				</FlipCard.Back>
			</FlipCard>
			<View className="flex-row items-center justify-between">
				<Text.Label>Show the back</Text.Label>
				<Switch
					isSelected={face === "back"}
					onSelectedChange={(isSelected) => setFace(isSelected ? "back" : "front")}
					testID="flip-card-controlled-switch"
				/>
			</View>
			<View className="flex-row items-center justify-between">
				<Text.Label>Refuse taps on the card</Text.Label>
				<Switch isSelected={isLocked} onSelectedChange={setLocked} testID="flip-card-controlled-lock" />
			</View>
		</View>
	);
}
