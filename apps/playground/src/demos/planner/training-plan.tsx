import { IconBed, IconBike, IconGoldMedal, IconStopwatch, IconWeight } from "@delacour/react-native-ui/icons/central";
import { Planner, type PlannerCategory, type PlannerEntry } from "@delacour/react-native-ui/planner";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A training plan",
	caption:
		"A dot per category, up to two icons and a `+N` on each day. Today is ringed, the legend counts the month, and a swipe on the grid pages it.",
	capture: { align: "stretch", flow: true, hero: true },
};

const CATEGORIES: readonly PlannerCategory[] = [
	{ id: "run", label: "Run", colorIndex: 1 },
	{ id: "strength", label: "Strength", colorIndex: 2 },
	{ id: "ride", label: "Ride", colorIndex: 3 },
	{ id: "rest", label: "Rest", colorIndex: 4 },
	{ id: "race", label: "Race", colorIndex: 5 },
];

/** A day of the current month, `offset` months away — so the plan is always around today. */
function day(date: number, offset = 0): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth() + offset, date);
}

/** A week's sessions, by weekday — Sunday is 0. */
const WEEK: Record<number, readonly Omit<PlannerEntry, "id" | "date">[]> = {
	0: [{ label: "Rest", category: "rest", icon: IconBed }],
	1: [{ label: "Strength", category: "strength", icon: IconWeight }],
	2: [{ label: "Easy run", category: "run", icon: IconStopwatch }],
	3: [
		{ label: "Ride", category: "ride", icon: IconBike },
		{ label: "Core", category: "strength", icon: IconWeight },
	],
	4: [{ label: "Intervals", category: "run", icon: IconStopwatch }],
	6: [
		{ label: "Long run", category: "run", icon: IconStopwatch },
		{ label: "Mobility", category: "strength", icon: IconWeight },
		{ label: "Recovery ride", category: "ride", icon: IconBike },
	],
};

const ENTRIES: readonly PlannerEntry[] = [-1, 0, 1].flatMap((offset) =>
	Array.from({ length: 31 }, (_, index) => day(index + 1, offset))
		.filter((date, index) => date.getDate() === index + 1)
		.flatMap((date) =>
			(WEEK[date.getDay()] ?? []).map((session, slot) => ({
				...session,
				id: `${date.toDateString()}-${slot}`,
				date,
			}))
		)
		.concat([
			{ id: `race-${offset}`, date: day(24, offset), label: "10 km race", category: "race", icon: IconGoldMedal },
		])
);

export function Demo(): ReactElement {
	return (
		<Planner categories={CATEGORIES} entries={ENTRIES} testID="planner-training">
			<Planner.Header>
				<Planner.Title />
				<Planner.Today testID="planner-training-today" />
				<Planner.Nav testID="planner-training-nav" />
			</Planner.Header>
			<Planner.Grid testID="planner-training-grid" />
			<Planner.Legend counts>
				<Planner.Summary />
			</Planner.Legend>
		</Planner>
	);
}
