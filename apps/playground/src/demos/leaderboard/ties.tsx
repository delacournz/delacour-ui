import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Ties",
	caption:
		"Ties share a rank and the next one skips — 1, 2, 2, 4. Tied entries keep the order they were passed in, and tied places on the podium stand level.",
};

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "ngaio", name: "Ngaio", value: 42 },
	{ id: "mihi", name: "Mihi", value: 38 },
	{ id: "aria", name: "Aria", value: 38 },
	{ id: "rawiri", name: "Rawiri", value: 31 },
	{ id: "lena", name: "Lena", value: 31 },
	{ id: "tomasi", name: "Tomasi", value: 27 },
];

export function Demo(): ReactElement {
	return <Leaderboard data={ENTRIES} podiumScale="rank" testID="leaderboard-ties" unit="goals" />;
}
