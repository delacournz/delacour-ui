import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bars",
	caption:
		"The top three stand on bars that grow on mount — third, second, then first — with each height proportional to the score. Everyone else is a row.",
	capture: { align: "stretch", hero: true },
};

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "tama", name: "Tama", value: 980 },
	{ id: "aroha", name: "Aroha", value: 1240 },
	{ id: "mere", name: "Mere", value: 1105 },
	{ id: "nikau", name: "Nikau", value: 860 },
	{ id: "kiri", name: "Kiri", value: 815 },
	{ id: "hemi", name: "Hemi", value: 790 },
];

export function Demo(): ReactElement {
	return <Leaderboard data={ENTRIES} testID="leaderboard-bars" unit="points" />;
}
