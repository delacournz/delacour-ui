import { Button } from "@delacour/react-native-ui/button";
import { Chip } from "@delacour/react-native-ui/chip";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Removable",
	caption:
		"`onClose` adds a remove control with a press of its own. On these selectable chips, removing one never also toggles it.",
	capture: { align: "stretch" },
};

const TOPICS = ["React Native", "Reanimated", "Uniwind", "Gesture Handler", "Expo", "Skia"] as const;

export function Demo(): ReactElement {
	const [topics, setTopics] = useState<readonly string[]>(TOPICS);
	const [followed, setFollowed] = useState<ReadonlySet<string>>(new Set(["Reanimated", "Expo"]));

	const remove = (topic: string) => setTopics((current) => current.filter((name) => name !== topic));
	const follow = (topic: string, isSelected: boolean) =>
		setFollowed((current) => {
			const next = new Set(current);
			if (isSelected) next.add(topic);
			else next.delete(topic);
			return next;
		});

	return (
		<View className="gap-3">
			<View className="flex-row flex-wrap gap-2">
				{topics.map((topic, index) => (
					<Chip
						closeAccessibilityLabel={`Remove ${topic}`}
						color="primary"
						isSelected={followed.has(topic)}
						key={topic}
						onClose={() => remove(topic)}
						onSelectedChange={(isSelected) => follow(topic, isSelected)}
						testID={`topic-${index}`}
					>
						{topic}
					</Chip>
				))}
			</View>
			{topics.length === 0 ? (
				<View className="flex-row items-center gap-3">
					<Text.Caption color="muted">All removed.</Text.Caption>
					<Button onPress={() => setTopics(TOPICS)} size="sm" testID="reset-topics" variant="secondary">
						Reset
					</Button>
				</View>
			) : null}
		</View>
	);
}
