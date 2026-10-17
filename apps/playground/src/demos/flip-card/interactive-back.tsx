import { Button } from "@delacour/react-native-ui/button";
import { FlipCard } from "@delacour/react-native-ui/flip-card";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A button on the back",
	align: "stretch",
	caption:
		"A control on a face is its own gesture, and the deepest one wins: pressing Copy counts a copy and leaves the card where it is. A tap anywhere else turns it.",
};

export function Demo(): ReactElement {
	const [copies, setCopies] = useState(0);

	return (
		<FlipCard className="h-40" testID="flip-card-interactive">
			<FlipCard.Front className="items-center justify-center">
				<Text.Title>Invite code</Text.Title>
				<Text.Caption>Tap to reveal</Text.Caption>
			</FlipCard.Front>
			<FlipCard.Back className="items-center justify-center gap-3">
				<Text.Header className="tabular-nums">DLC-4821</Text.Header>
				<Button onPress={() => setCopies((count) => count + 1)} size="sm" testID="flip-card-copy" variant="outline">
					{copies === 0 ? "Copy" : `Copied ${copies}×`}
				</Button>
			</FlipCard.Back>
		</FlipCard>
	);
}
