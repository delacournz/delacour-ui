import { FlipCard } from "@delacour/react-native-ui/flip-card";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Swipe",
	caption:
		'`trigger="swipe"`: the turn follows your finger, leans past either rest, and settles on the nearer face — or the way you flicked. `swipeDistance` is the drag that makes a half turn. A screen reader gets a "Flip card" action in its place.',
	capture: { align: "stretch", flow: true },
};

export function Demo(): ReactElement {
	return (
		<FlipCard className="h-48" swipeDistance={240} testID="flip-card-swipe" trigger="swipe">
			<FlipCard.Front className="items-center justify-center">
				<Text.Title>Drag me sideways</Text.Title>
				<Text.Caption>Let go half way, or flick</Text.Caption>
			</FlipCard.Front>
			<FlipCard.Back className="items-center justify-center">
				<Text.Title>And back again</Text.Title>
			</FlipCard.Back>
		</FlipCard>
	);
}
