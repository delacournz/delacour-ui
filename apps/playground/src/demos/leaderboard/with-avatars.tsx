import { Avatar } from "@delacour/react-native-ui/avatar";
import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With avatars",
	caption: "`renderMedia` draws anything beside a name — here an `Avatar`, larger on the podium than in the rows.",
};

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "ngaio", name: "Ngaio Fraser", subtitle: "Team Ember", value: 18_204 },
	{ id: "mihi", name: "Mihi Paewai", subtitle: "Team Tide", value: 16_950 },
	{ id: "aria", name: "Aria Whitlock", subtitle: "Team Ember", value: 15_310 },
	{ id: "rawiri", name: "Rawiri Kemp", subtitle: "Team Ridge", value: 12_880 },
	{ id: "lena", name: "Lena Varga", subtitle: "Team Tide", value: 11_045 },
];

export function Demo(): ReactElement {
	return (
		<Leaderboard
			data={ENTRIES}
			renderMedia={(entry, rank) => <Avatar name={entry.name} size={rank <= 3 ? "md" : "sm"} />}
			testID="leaderboard-with-avatars"
			unit="steps"
		/>
	);
}
