import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pressable",
	caption:
		"`onPressEntry` makes every place a button, and hands back the entry and its rank. Tap the picked place again to clear it.",
	capture: { align: "stretch", flow: "leaderboard/pressable", hero: true },
};

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "ngaio", name: "Ngaio", value: 1_240 },
	{ id: "mihi", name: "Mihi", value: 1_105 },
	{ id: "aria", name: "Aria", value: 980 },
	{ id: "rawiri", name: "Rawiri", value: 860 },
	{ id: "lena", name: "Lena", value: 815 },
];

export function Demo(): ReactElement {
	const [picked, setPicked] = useState<string | null>(null);

	return (
		<View className="gap-4">
			<Leaderboard
				data={ENTRIES}
				onPressEntry={(entry, rank) => {
					const label = `${entry.name}, rank ${rank}`;
					setPicked((current) => (current === label ? null : label));
				}}
				testID="leaderboard-pressable"
				unit="points"
			/>
			<Text.Caption align="center" testID="leaderboard-pressable-picked">
				{picked ?? "Tap a place"}
			</Text.Caption>
		</View>
	);
}
