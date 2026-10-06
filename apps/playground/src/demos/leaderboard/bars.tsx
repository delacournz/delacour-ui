import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bars",
	caption:
		"The top three stand on bars that grow on mount — third, second, then first — with each height proportional to the score. Everyone else is a row.",
	capture: { align: "stretch" },
};

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "aria", name: "Aria", value: 980 },
	{ id: "ngaio", name: "Ngaio", value: 1240 },
	{ id: "mihi", name: "Mihi", value: 1105 },
	{ id: "rawiri", name: "Rawiri", value: 860 },
	{ id: "lena", name: "Lena", value: 815 },
	{ id: "tomasi", name: "Tomasi", value: 790 },
];

export function Demo(): ReactElement {
	return <Leaderboard data={ENTRIES} testID="leaderboard-bars" unit="points" />;
}
