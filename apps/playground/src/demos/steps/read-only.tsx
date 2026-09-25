import { Button } from "@delacour/react-native-ui/button";
import { Steps } from "@delacour/react-native-ui/steps";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Read-only progress",
	caption:
		"A controlled `value` with no `onValueChange` is a progress display: the steps are plain views, not buttons, and only the app moves them.",
};

const STAGES = ["Uploaded", "Processing", "Published"] as const;

export function Demo(): ReactElement {
	const [stage, setStage] = useState(0);

	return (
		<View className="gap-6">
			<Steps size="sm" value={stage} variant="secondary">
				{STAGES.map((title, index) => (
					<Steps.Item
						isLoading={index === 1 && stage === 1}
						key={title}
						step={index}
						testID={`steps-read-only-${index}`}
					>
						{title}
					</Steps.Item>
				))}
			</Steps>
			<Button
				onPress={() => setStage(stage >= STAGES.length ? 0 : stage + 1)}
				size="sm"
				testID="steps-read-only-advance"
				variant="outline"
			>
				{stage >= STAGES.length ? "Start again" : "Advance"}
			</Button>
		</View>
	);
}
