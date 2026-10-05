import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Movement",
	caption:
		"`change` is the places moved since the last period. Up is drawn in the success tone, down in the destructive one, and no change as a dash.",
	align: "stretch",
};

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "aroha", name: "Aroha", value: 2_480, change: 1 },
	{ id: "mere", name: "Mere", value: 2_310, change: -1 },
	{ id: "tama", name: "Tama", value: 2_150, change: 0 },
	{ id: "nikau", name: "Nikau", value: 1_990, change: 3 },
	{ id: "kiri", name: "Kiri", value: 1_870, change: -2 },
	{ id: "hemi", name: "Hemi", value: 1_720, change: 0 },
	{ id: "rangi", name: "Rangi", value: 1_640, change: -1 },
];

export function Demo(): ReactElement {
	return <Leaderboard data={ENTRIES} podium="none" testID="leaderboard-movement" unit="points" />;
}
