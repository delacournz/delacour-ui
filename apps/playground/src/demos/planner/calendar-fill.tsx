import { Planner, type PlannerCategory, type PlannerEntry } from "@delacour/react-native-ui/planner";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Calendar, filling its space",
	caption:
		'`variant="calendar"` names each entry in a block of its colour, three to a day before `+N more`. It needs height, so `fill` shares the planner\'s among the six weeks.',
	align: "stretch",
};

const CATEGORIES: readonly PlannerCategory[] = [
	{ id: "post", label: "Post", colorIndex: 1 },
	{ id: "video", label: "Video", colorIndex: 3 },
	{ id: "newsletter", label: "Newsletter", colorIndex: 5 },
	{ id: "launch", label: "Launch", color: "#EC4899" },
];

const PLAN: readonly [number, string, string][] = [
	[2, "post", "Spring recap"],
	[3, "video", "Studio tour"],
	[6, "newsletter", "Issue 41"],
	[8, "post", "Behind the brand"],
	[9, "post", "Customer story"],
	[9, "video", "How it's made"],
	[13, "newsletter", "Issue 42"],
	[14, "launch", "Autumn range"],
	[14, "post", "Launch teaser"],
	[14, "video", "Launch film"],
	[14, "post", "Launch thread"],
	[17, "post", "FAQ"],
	[20, "newsletter", "Issue 43"],
	[22, "video", "Q&A live"],
	[24, "post", "Team spotlight"],
	[27, "newsletter", "Issue 44"],
	[29, "post", "Month in review"],
];

const ENTRIES: readonly PlannerEntry[] = PLAN.map(([date, category, label]) => {
	const now = new Date();
	return { id: `${date}-${label}`, date: new Date(now.getFullYear(), now.getMonth(), date), category, label };
});

export function Demo(): ReactElement {
	return (
		<View className="h-[640px]">
			<Planner categories={CATEGORIES} entries={ENTRIES} fill variant="calendar">
				<Planner.Header>
					<Planner.Title />
					<Planner.Today />
					<Planner.Nav />
				</Planner.Header>
				<Planner.Grid />
				<Planner.Legend />
			</Planner>
		</View>
	);
}
