import { Leaderboard } from "@delacour/react-native-ui/leaderboard";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Empty",
	caption: "With no entries the board says so. `emptyText` changes the line.",
};

export function Demo(): ReactElement {
	return <Leaderboard data={[]} emptyText="No scores this week yet" testID="leaderboard-empty" />;
}
