import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Cards",
	caption: '`podium="cards"` sets the top three on cards instead, the leader lifted above the other two.',
	capture: { align: "stretch" },
};

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "north", name: "North", subtitle: "Auckland", value: 48_120 },
	{ id: "central", name: "Central", subtitle: "Wellington", value: 52_940 },
	{ id: "south", name: "South", subtitle: "Christchurch", value: 39_870 },
	{ id: "west", name: "West", subtitle: "New Plymouth", value: 31_200 },
	{ id: "east", name: "East", subtitle: "Gisborne", value: 28_450 },
];

export function Demo(): ReactElement {
	return <Leaderboard data={ENTRIES} podium="cards" testID="leaderboard-cards" unit="dollars" />;
}
