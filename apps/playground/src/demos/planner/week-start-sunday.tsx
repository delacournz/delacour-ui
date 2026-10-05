import { PLANNER_WEEK_STARTS, Planner, type PlannerWeekStart } from "@delacour/react-native-ui/planner";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Where the week starts",
	caption:
		"`weekStartsOn` takes any weekday, or `auto` to ask the locale. Here an American locale starts on Sunday; pick another to move the columns.",
};

const LABELS: Record<PlannerWeekStart, string> = { 0: "Su", 1: "Mo", 2: "Tu", 3: "We", 4: "Th", 5: "Fr", 6: "Sa" };

export function Demo(): ReactElement {
	const [weekStartsOn, setWeekStartsOn] = useState<PlannerWeekStart | "auto">("auto");

	return (
		<View className="gap-3">
			<Planner locale="en-US" weekStartsOn={weekStartsOn}>
				<Planner.Header>
					<Planner.Title />
					<Planner.Nav />
				</Planner.Header>
				<Planner.Grid />
			</Planner>
			<View className="flex-row flex-wrap gap-1">
				<ToggleButton isSelected={weekStartsOn === "auto"} onSelectedChange={() => setWeekStartsOn("auto")} size="sm">
					Auto
				</ToggleButton>
				{PLANNER_WEEK_STARTS.map((day) => (
					<ToggleButton
						isSelected={weekStartsOn === day}
						key={day}
						onSelectedChange={() => setWeekStartsOn(day)}
						size="sm"
					>
						{LABELS[day]}
					</ToggleButton>
				))}
			</View>
		</View>
	);
}
