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
	capture: { flow: "avatar/group", hero: true },
};

const TEAM = [
	{ name: "Aria Whitlock", photo: "https://i.pravatar.cc/160?img=16" },
	{ name: "Rawiri Kemp", photo: "https://i.pravatar.cc/160?img=13" },
	{ name: "Kenji Moriyama" },
	{ name: "Lena Varga", photo: "https://i.pravatar.cc/160?img=26" },
	{ name: "Tomasi Fifita", photo: "https://i.pravatar.cc/160?img=51" },
	{ name: "Priya Natarajan" },
	{ name: "Isla Brennan", photo: "https://i.pravatar.cc/160?img=36" },
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
