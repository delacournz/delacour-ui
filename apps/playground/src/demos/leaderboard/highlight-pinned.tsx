import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Highlight, pinned",
	caption:
		"`limit={5}` shows a top five. `highlightId` is fourteenth, so it is pinned under the cut with its true rank, tinted so it is found at a glance.",
	capture: { align: "stretch" },
};

const NAMES = [
	"Aroha",
	"Mere",
	"Tama",
	"Nikau",
	"Kiri",
	"Hemi",
	"Rangi",
	"Ana",
	"Pita",
	"Ngaio",
	"Wiremu",
	"Rua",
	"Manaia",
	"You",
	"Tui",
	"Kahu",
];

const ENTRIES: readonly LeaderboardEntry[] = NAMES.map((name, i) => ({
	id: name.toLowerCase(),
	name,
	value: 24_000 - i * 1_150,
}));

export function Demo(): ReactElement {
	return (
		<Leaderboard
			data={ENTRIES}
			highlightId="you"
			limit={5}
			podium="none"
			testID="leaderboard-highlight-pinned"
			unit="steps"
		/>
	);
}
