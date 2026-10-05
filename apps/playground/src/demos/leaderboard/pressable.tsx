import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pressable",
	caption: "`onPressEntry` makes every place a button, and hands back the entry and its rank.",
};

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "aroha", name: "Aroha", value: 1_240 },
	{ id: "mere", name: "Mere", value: 1_105 },
	{ id: "tama", name: "Tama", value: 980 },
	{ id: "nikau", name: "Nikau", value: 860 },
	{ id: "kiri", name: "Kiri", value: 815 },
];

export function Demo(): ReactElement {
	const [picked, setPicked] = useState("Tap a place");

	return (
		<View className="gap-4">
			<Leaderboard
				data={ENTRIES}
				onPressEntry={(entry, rank) => setPicked(`${entry.name}, rank ${rank}`)}
				testID="leaderboard-pressable"
				unit="points"
			/>
			<Text.Caption align="center" testID="leaderboard-pressable-picked">
				{picked}
			</Text.Caption>
		</View>
	);
}
