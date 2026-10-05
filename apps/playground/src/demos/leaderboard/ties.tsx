import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Ties",
	caption:
		"Ties share a rank and the next one skips — 1, 2, 2, 4. Tied entries keep the order they were passed in, and tied places on the podium stand level.",
};

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "aroha", name: "Aroha", value: 42 },
	{ id: "mere", name: "Mere", value: 38 },
	{ id: "tama", name: "Tama", value: 38 },
	{ id: "nikau", name: "Nikau", value: 31 },
	{ id: "kiri", name: "Kiri", value: 31 },
	{ id: "hemi", name: "Hemi", value: 27 },
];

export function Demo(): ReactElement {
	return <Leaderboard data={ENTRIES} podiumScale="rank" testID="leaderboard-ties" unit="goals" />;
}
