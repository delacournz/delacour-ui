import { IconArrowRotateCounterClockwise, IconCrossSmall, IconHeart } from "@delacour/react-native-ui/icons/central";
import { StackCard, useStackCard } from "@delacour/react-native-ui/stack-card";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Undo",
	caption:
		"`undo` brings the last card back from the side it left, and does not call `onSwipe`. `useStackCard()` reads the deck from inside it — here, the line the empty pile shows.",
	capture: { align: "stretch", flow: "stack-card/undo" },
};

const WORDS = [
	{ word: "Kaitiakitanga", gloss: "Guardianship of the land and sea" },
	{ word: "Manaakitanga", gloss: "Hospitality, care for others" },
	{ word: "Whanaungatanga", gloss: "Kinship, a sense of belonging" },
	{ word: "Tūrangawaewae", gloss: "A place to stand" },
] as const;

function Finished(): ReactElement {
	const { count, canUndo } = useStackCard();

	return (
		<Text align="center" color="muted">
			{canUndo ? `All ${count} done — undo to go back` : `All ${count} done`}
		</Text>
	);
}

export function Demo(): ReactElement {
	return (
		<StackCard className="h-[440px]" directionLabels={{ left: "Again", right: "Got it" }} testID="undo-deck">
			<StackCard.Stamp color="warning" direction="left">
				Again
			</StackCard.Stamp>
			<StackCard.Stamp color="success" direction="right">
				Got it
			</StackCard.Stamp>
			{WORDS.map((entry, position) => (
				<StackCard.Card
					className="items-center justify-center gap-2 p-6"
					key={entry.word}
					testID={`undo-card-${position}`}
				>
					<Text variant="overline">
						{position + 1} of {WORDS.length}
					</Text>
					<Text variant="title">{entry.word}</Text>
					<Text align="center" color="muted">
						{entry.gloss}
					</Text>
				</StackCard.Card>
			))}
			<StackCard.Empty>
				<Finished />
			</StackCard.Empty>
			<StackCard.Actions>
				<StackCard.Action action="left" icon={IconCrossSmall} testID="undo-again" />
				<StackCard.Action action="undo" icon={IconArrowRotateCounterClockwise} testID="undo-undo" />
				<StackCard.Action action="right" icon={IconHeart} testID="undo-got-it" />
			</StackCard.Actions>
		</StackCard>
	);
}
