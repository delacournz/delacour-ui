import { Planner, type PlannerCategory, type PlannerEntry } from "@delacour/react-native-ui/planner";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scrolling weeks",
	caption:
		"`Planner.Scroller` is a virtualised list of weeks either side of the opening month. The title follows the week at the top; `Nav` and `Today` scroll to their week.",
	capture: { align: "stretch", flow: "planner/scroller" },
};

const CATEGORIES: readonly PlannerCategory[] = [
	{ id: "shift", label: "Shift", colorIndex: 2 },
	{ id: "leave", label: "Leave", colorIndex: 4 },
];

/** A shift every weekday for a year either way, and a fortnight's leave next month. */
const ENTRIES: readonly PlannerEntry[] = (() => {
	const now = new Date();
	return Array.from({ length: 730 }, (_, index) => new Date(now.getFullYear(), now.getMonth(), index - 365)).flatMap(
		(date): PlannerEntry[] => {
			const weekday = date.getDay();
			if (weekday === 0 || weekday === 6) return [];
			const isLeave = date.getMonth() === (now.getMonth() + 1) % 12 && date.getDate() >= 8 && date.getDate() <= 21;
			return [
				isLeave
					? { id: date.toDateString(), date, label: "Leave", category: "leave" }
					: { id: date.toDateString(), date, label: weekday % 2 ? "Early" : "Late", category: "shift" },
			];
		}
	);
})();

export function Demo(): ReactElement {
	return (
		<View className="h-[560px]">
			<Planner categories={CATEGORIES} entries={ENTRIES} fill variant="calendar">
				<Planner.Header>
					<Planner.Title />
					<Planner.Today />
					<Planner.Nav />
				</Planner.Header>
				<Planner.Scroller rowHeight={88} testID="planner-scroller" weeks={26} />
			</Planner>
		</View>
	);
}
