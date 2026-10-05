import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Ascending times",
	caption:
		'`order="asc"` ranks the smallest first, for lap times. The bars switch to fixed heights by place, because a bar proportional to the time would draw the winner shortest.',
	capture: { align: "stretch" },
};

const LAPS: readonly LeaderboardEntry[] = [
	{ id: "rua", name: "Rua", value: 62.418 },
	{ id: "ana", name: "Ana", value: 61.902 },
	{ id: "wiremu", name: "Wiremu", value: 63.05 },
	{ id: "ngaio", name: "Ngaio", value: 61.774 },
	{ id: "pita", name: "Pita", value: 64.31 },
];

function formatLapTime(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const rest = (seconds - minutes * 60).toFixed(3).padStart(6, "0");
	return `${minutes}:${rest}`;
}

export function Demo(): ReactElement {
	return (
		<Leaderboard
			data={LAPS}
			formatValue={formatLapTime}
			order="asc"
			testID="leaderboard-ascending-times"
			unit="seconds"
		/>
	);
}
