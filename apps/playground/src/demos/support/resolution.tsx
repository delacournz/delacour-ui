import { Button } from "@delacour/react-native-ui/button";
import { Rating } from "@delacour/react-native-ui/rating";
import { Support } from "@delacour/react-native-ui/support";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Resolution",
	caption:
		"The closing question takes whatever control the app hands it — a `Rating`, or two buttons — and the app swaps it for a thank-you once answered.",
};

export function Demo(): ReactElement {
	const [score, setScore] = useState(0);
	const [helped, setHelped] = useState<boolean | null>(null);

	return (
		<View className="gap-4">
			<Support.Resolution question="How did we do?">
				<Rating onChange={setScore} value={score}>
					<Rating.Stars accessibilityLabel="Rate this conversation" />
				</Rating>
			</Support.Resolution>
			<Support.Resolution question="Did that help?">
				{helped === null ? (
					<View className="flex-row gap-2">
						<Button onPress={() => setHelped(true)} size="sm" variant="secondary">
							Yes
						</Button>
						<Button onPress={() => setHelped(false)} size="sm" variant="secondary">
							No
						</Button>
					</View>
				) : (
					<Text className="text-muted-foreground">{helped ? "Glad to hear it." : "Sorry — we'll pass that on."}</Text>
				)}
			</Support.Resolution>
		</View>
	);
}
