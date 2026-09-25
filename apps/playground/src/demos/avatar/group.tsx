import { Avatar } from "@delacour/react-native-ui/avatar";
import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group",
	align: "center",
	caption:
		"`max` caps the faces, not the row; the rest are counted into a trailing `+N`. Each face wears a ring in the page background, and the first sits on top.",
	capture: { hero: true },
};

const TEAM = [
	{ name: "Kate Austen", photo: "https://i.pravatar.cc/160?img=47" },
	{ name: "Oliver Lee", photo: "https://i.pravatar.cc/160?img=12" },
	{ name: "Chen Wei" },
	{ name: "Dana Kim", photo: "https://i.pravatar.cc/160?img=32" },
	{ name: "Ben Okafor", photo: "https://i.pravatar.cc/160?img=15" },
	{ name: "Ana Silva" },
	{ name: "Sam Rivera", photo: "https://i.pravatar.cc/160?img=5" },
] as const;

export function Demo(): ReactElement {
	const [max, setMax] = useState(4);

	return (
		<View className="items-center gap-4">
			<Avatar.Group max={max} testID="avatar-group">
				{TEAM.map((person) => (
					<Avatar key={person.name} name={person.name} source={"photo" in person ? { uri: person.photo } : undefined} />
				))}
			</Avatar.Group>
			<View className="flex-row items-center gap-3">
				<Button
					accessibilityLabel="Show fewer"
					isDisabled={max <= 1}
					onPress={() => setMax((value) => value - 1)}
					size="sm"
					testID="group-fewer"
					variant="secondary"
				>
					−
				</Button>
				<Text.Caption color="muted" testID="group-max">{`max ${max}`}</Text.Caption>
				<Button
					accessibilityLabel="Show more"
					isDisabled={max >= TEAM.length}
					onPress={() => setMax((value) => value + 1)}
					size="sm"
					testID="group-more"
					variant="secondary"
				>
					+
				</Button>
			</View>
		</View>
	);
}
