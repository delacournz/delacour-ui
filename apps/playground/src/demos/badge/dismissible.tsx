import { Badge } from "@delacour/native-ui/badge";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dismissible",
	note: 'The dismiss control is its own pressable. On the "Both" badge below, its tap moves the dismissed counter and leaves the pressed counter alone.',
};

const TAGS = ["React Native", "Reanimated", "Uniwind", "Gesture Handler", "Expo", "Tailwind"] as const;

export function Demo(): ReactElement {
	const [tags, setTags] = useState<readonly string[]>(TAGS);

	const remove = (tag: string) => setTags((current) => current.filter((name) => name !== tag));

	return (
		<View className="flex-row flex-wrap gap-2">
			{tags.map((tag, index) => (
				<Badge color="primary" key={tag} onClose={() => remove(tag)} testID={`tag-${index}`} variant="soft">
					{tag}
				</Badge>
			))}
			{tags.length === 0 ? <Text.Caption color="muted">All dismissed.</Text.Caption> : null}
		</View>
	);
}
