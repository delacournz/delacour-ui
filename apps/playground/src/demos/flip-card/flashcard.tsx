import { FlipCard } from "@delacour/react-native-ui/flip-card";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A flashcard",
	caption:
		'`trigger="manual"` and a `FlipCard.Trigger` beneath it. Anything passed to the root that is not a face renders under the card, so the back never covers the button.',
	capture: { align: "stretch", flow: "flip-card/flashcard" },
};

export function Demo(): ReactElement {
	return (
		<FlipCard className="h-44" faceLabels={{ back: "Answer", front: "Question" }} trigger="manual">
			<FlipCard.Front className="items-center justify-center gap-1">
				<Text.Overline>Question</Text.Overline>
				<Text.Title>Bonjour</Text.Title>
			</FlipCard.Front>
			<FlipCard.Back className="items-center justify-center gap-1">
				<Text.Overline>Answer</Text.Overline>
				<Text.Title>Hello</Text.Title>
			</FlipCard.Back>
			<FlipCard.Trigger className="self-center" testID="flip-card-trigger">
				<Text.Label>Reveal</Text.Label>
			</FlipCard.Trigger>
		</FlipCard>
	);
}
