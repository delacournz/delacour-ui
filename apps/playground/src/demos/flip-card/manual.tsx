import { Button } from "@delacour/react-native-ui/button";
import { FlipCard, type FlipCardHandle } from "@delacour/react-native-ui/flip-card";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useRef } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Manual, by ref",
	align: "stretch",
	caption:
		'`trigger="manual"` mounts no gesture: taps on the card do nothing, and the app turns it through the ref\'s `flip()` and `flipTo()`.',
};

export function Demo(): ReactElement {
	const card = useRef<FlipCardHandle>(null);

	return (
		<View className="gap-4">
			<FlipCard className="h-36" ref={card} testID="flip-card-manual" trigger="manual">
				<FlipCard.Front className="items-center justify-center">
					<Text.Title>Front</Text.Title>
				</FlipCard.Front>
				<FlipCard.Back className="items-center justify-center">
					<Text.Title>Back</Text.Title>
				</FlipCard.Back>
			</FlipCard>
			<View className="flex-row justify-center gap-2">
				<Button onPress={() => card.current?.flipTo("front")} size="sm" variant="outline">
					Front
				</Button>
				<Button onPress={() => card.current?.flip()} size="sm" testID="flip-card-manual-flip">
					Flip
				</Button>
				<Button onPress={() => card.current?.flipTo("back")} size="sm" variant="outline">
					Back
				</Button>
			</View>
		</View>
	);
}
