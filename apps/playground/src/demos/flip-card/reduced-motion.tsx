import { FlipCard } from "@delacour/react-native-ui/flip-card";
import { CalmMotionProvider } from "@delacour/react-native-ui/hooks/use-calm-motion";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Reduced motion",
	caption:
		"Under the OS setting or `DelacourProvider`'s `isMotionCalm`, nothing turns: the faces crossfade in 150 ms, and the announcement, the haptic and `onFlipEnd` behave the same.",
};

export function Demo(): ReactElement {
	return (
		<CalmMotionProvider isMotionCalm>
			<FlipCard className="h-36" testID="flip-card-calm">
				<FlipCard.Front className="items-center justify-center">
					<Text.Title>Tap me</Text.Title>
				</FlipCard.Front>
				<FlipCard.Back className="items-center justify-center">
					<Text.Title>A crossfade, not a turn</Text.Title>
				</FlipCard.Back>
			</FlipCard>
		</CalmMotionProvider>
	);
}
