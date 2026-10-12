import { Planner, type PlannerDayInfo, type PlannerEntry } from "@delacour/react-native-ui/planner";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Days of your own",
	caption:
		"`renderDay` draws the inside of each day — here a bar of the distance run. The button, its spoken label and the selection stay the planner's.",
	capture: { align: "stretch" },
};

const DISTANCES = [0, 6, 0, 8, 5, 0, 18, 0, 7, 0, 10, 6, 0, 21, 0, 6, 0, 9, 5, 0, 16, 0, 8, 0, 12, 6, 0, 24, 0, 5, 7];

const ENTRIES: readonly PlannerEntry[] = (() => {
	const now = new Date();
	return DISTANCES.flatMap((km, index) =>
		km === 0
			? []
			: [{ id: String(index), date: new Date(now.getFullYear(), now.getMonth(), index + 1), label: `${km} km` }]
	);
})();

/** The longest run sets the scale, so the tallest bar fills its day. */
const MAX_KM = Math.max(...DISTANCES);

function DistanceDay({ info }: { info: PlannerDayInfo }): ReactElement {
	const { date, entries, isInMonth, isSelected, isToday } = info;
	const km = entries.reduce((sum, entry) => sum + Number.parseFloat(entry.label), 0);
	return (
		<View className={`flex-1 items-center justify-end gap-0.5 rounded-md pb-1 ${isSelected ? "bg-primary/10" : ""}`}>
			<View className="w-3 rounded-sm bg-chart-1" style={{ height: Math.max(2, (km / MAX_KM) * 36) }} />
			<Text
				className={`text-[10px] tabular-nums ${isToday ? "font-semibold text-primary" : isInMonth ? "text-foreground" : "text-muted-foreground"}`}
			>
				{date.getDate()}
			</Text>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<Planner entries={ENTRIES} showOutsideDays={false}>
			<Planner.Header>
				<Planner.Title />
				<Planner.Nav />
			</Planner.Header>
			<Planner.Grid renderDay={(info) => <DistanceDay info={info} />} />
		</Planner>
	);
}
