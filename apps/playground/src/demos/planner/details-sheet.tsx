import { Icon } from "@delacour/react-native-ui/icon";
import { IconBike, IconStopwatch, IconWeight } from "@delacour/react-native-ui/icons/central";
import { Planner, type PlannerCategory, type PlannerEntry } from "@delacour/react-native-ui/planner";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A sheet of the day",
	caption:
		"`Planner.Details` opens a sheet while a day is selected. Closing it — the button, a swipe, the scrim — clears the selection.",
	capture: { flow: "planner/details-sheet", frame: "device" },
};

const CATEGORIES: readonly PlannerCategory[] = [
	{ id: "run", label: "Run", colorIndex: 1 },
	{ id: "strength", label: "Strength", colorIndex: 2 },
	{ id: "ride", label: "Ride", colorIndex: 3 },
];

/** October 2026, fixed, so the clip's tap always lands on the same busy day. */
const ENTRIES: readonly PlannerEntry[] = [
	{ id: "1", date: "2026-10-05", label: "Strength", category: "strength", icon: IconWeight },
	{ id: "2", date: "2026-10-06", label: "Easy run · 6 km", category: "run", icon: IconStopwatch },
	{ id: "3", date: "2026-10-08", label: "Intervals · 8 × 400 m", category: "run", icon: IconStopwatch },
	{ id: "4", date: "2026-10-14", label: "Tempo run · 8 km", category: "run", icon: IconStopwatch },
	{ id: "5", date: "2026-10-14", label: "Upper body", category: "strength", icon: IconWeight },
	{ id: "6", date: "2026-10-14", label: "Recovery spin · 30 min", category: "ride", icon: IconBike },
	{ id: "7", date: "2026-10-17", label: "Long run · 18 km", category: "run", icon: IconStopwatch },
	{ id: "8", date: "2026-10-21", label: "Hill repeats", category: "run", icon: IconStopwatch },
	{ id: "9", date: "2026-10-24", label: "Group ride · 60 km", category: "ride", icon: IconBike },
];

const COLOR: Record<string, string> = { run: "chart-1", strength: "chart-2", ride: "chart-3" };

export function Demo(): ReactElement {
	return (
		<View className="flex-1 justify-center px-4">
			<Planner categories={CATEGORIES} defaultMonth={new Date(2026, 9, 1)} entries={ENTRIES}>
				<Planner.Header>
					<Planner.Title />
					<Planner.Nav />
				</Planner.Header>
				<Planner.Grid testID="planner-details" />
				<Planner.Details description={(_, entries) => `${entries.length} sessions planned`}>
					{(_, entries) => (
						<View className="gap-3 pb-2">
							{entries.map((entry) => (
								<View className="flex-row items-center gap-3" key={entry.id}>
									{entry.icon ? <Icon color={COLOR[entry.category ?? ""]} icon={entry.icon} /> : null}
									<Text.Paragraph>{entry.label}</Text.Paragraph>
								</View>
							))}
						</View>
					)}
				</Planner.Details>
			</Planner>
		</View>
	);
}
