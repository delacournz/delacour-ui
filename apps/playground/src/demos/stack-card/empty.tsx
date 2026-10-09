import { Button } from "@delacour/react-native-ui/button";
import { StackCard } from "@delacour/react-native-ui/stack-card";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Empty and refill",
	caption:
		"`StackCard.Empty` shows where the cards were once the last one leaves, and `onEmpty` fires once. Setting `index` from outside refills the deck and clears its undo history.",
};

const SUGGESTIONS = ["Try the new ramen place", "Call Grandma", "Water the plants"] as const;

export function Demo(): ReactElement {
	const [index, setIndex] = useState(0);
	const [emptied, setEmptied] = useState(0);

	return (
		<StackCard
			className="h-[360px]"
			index={index}
			onEmpty={() => setEmptied((times) => times + 1)}
			onIndexChange={setIndex}
			testID="empty-deck"
		>
			{SUGGESTIONS.map((suggestion) => (
				<StackCard.Card className="items-center justify-center p-6" key={suggestion}>
					<Text align="center" variant="header">
						{suggestion}
					</Text>
				</StackCard.Card>
			))}
			<StackCard.Empty>
				<View className="items-center gap-3">
					<Text color="muted">
						Emptied {emptied} {emptied === 1 ? "time" : "times"}
					</Text>
					<Button onPress={() => setIndex(0)} testID="empty-refill" variant="secondary">
						Refill
					</Button>
				</View>
			</StackCard.Empty>
		</StackCard>
	);
}
