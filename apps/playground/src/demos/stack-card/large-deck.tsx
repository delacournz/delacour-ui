import { StackCard, useStackCard } from "@delacour/react-native-ui/stack-card";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Five hundred cards",
	caption:
		"Only a window around the top card is mounted — one behind for undo, `depth` drawn, one more fading in — so a deck of five hundred costs what a deck of five does.",
	capture: { align: "stretch" },
};

const CARDS = Array.from({ length: 500 }, (_, position) => position + 1);

function Counter(): ReactElement {
	const { index, count } = useStackCard();

	return (
		<Text align="center" variant="caption">
			{index} thrown of {count}
		</Text>
	);
}

export function Demo(): ReactElement {
	return (
		<StackCard className="h-[400px]" depth={4} testID="large-deck">
			{CARDS.map((number) => (
				<StackCard.Card className="items-center justify-center" key={number}>
					<Text variant="display">{number}</Text>
				</StackCard.Card>
			))}
			<StackCard.Empty>All five hundred</StackCard.Empty>
			<StackCard.Actions>
				<Counter />
			</StackCard.Actions>
		</StackCard>
	);
}
