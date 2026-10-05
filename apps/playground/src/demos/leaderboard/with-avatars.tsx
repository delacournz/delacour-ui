import { Avatar } from "@delacour/react-native-ui/avatar";
import { Leaderboard, type LeaderboardEntry } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With avatars",
	caption: "`renderMedia` draws anything beside a name — here an `Avatar`, larger on the podium than in the rows.",
};

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "aroha", name: "Aroha Ngata", subtitle: "Team Kea", value: 18_204 },
	{ id: "mere", name: "Mere Tawhiri", subtitle: "Team Tūī", value: 16_950 },
	{ id: "tama", name: "Tama Rewi", subtitle: "Team Kea", value: 15_310 },
	{ id: "nikau", name: "Nikau Pōtae", subtitle: "Team Ruru", value: 12_880 },
	{ id: "kiri", name: "Kiri Hōne", subtitle: "Team Tūī", value: 11_045 },
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
