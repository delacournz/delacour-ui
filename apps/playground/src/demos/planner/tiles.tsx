import { IconBook, IconHeart, IconMoon, IconPencil } from "@delacour/react-native-ui/icons/central";
import { Planner, type PlannerCategory, type PlannerEntry } from "@delacour/react-native-ui/planner";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Tiles",
	caption:
		'`variant="tiles"`: one large icon per day, tinted by its first entry\'s category, with the date in the corner — a habit log read at a glance.',
	capture: { align: "stretch" },
};

const CATEGORIES: readonly PlannerCategory[] = [
	{ id: "read", label: "Read", colorIndex: 1 },
	{ id: "write", label: "Journal", colorIndex: 2 },
	{ id: "sleep", label: "Slept 8h", colorIndex: 3 },
	{ id: "kind", label: "Kindness", colorIndex: 5 },
];

const HABITS = [
	{ category: "read", label: "Read", icon: IconBook },
	{ category: "write", label: "Journal", icon: IconPencil },
	{ category: "sleep", label: "Slept 8h", icon: IconMoon },
	{ category: "kind", label: "Kindness", icon: IconHeart },
] as const;

/** A deterministic scatter over the current month: most days log one habit, some two, some none. */
const ENTRIES: readonly PlannerEntry[] = (() => {
	const now = new Date();
	const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
	return Array.from({ length: days }, (_, index) => index + 1).flatMap((date) => {
		if (date % 7 === 3) return [];
		const first = HABITS[(date * 5) % HABITS.length];
		const second = date % 4 === 0 ? HABITS[(date + 1) % HABITS.length] : undefined;
		return [first, second]
			.filter((habit) => habit !== undefined)
			.map((habit) => ({
				...habit,
				id: `${date}-${habit.category}`,
				date: new Date(now.getFullYear(), now.getMonth(), date),
			}));
	});
})();

export function Demo(): ReactElement {
	return (
		<Planner categories={CATEGORIES} entries={ENTRIES} showOutsideDays={false} variant="tiles">
			<Planner.Header>
				<Planner.Title />
				<Planner.Nav />
			</Planner.Header>
			<Planner.Grid />
			<Planner.Legend />
		</Planner>
	);
}
