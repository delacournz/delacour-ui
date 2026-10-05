import { Table, type TableSortDirection } from "@delacour/react-native-ui/table";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sortable",
	caption:
		"A head with `sort` is a button that draws the sort state; the caller owns the order. Tap a heading to sort by it, and again to reverse.",
	capture: { align: "stretch", flow: "table/sortable", hero: true },
};

type Key = "name" | "points";

const TEAMS = [
	{ id: "a", name: "Kākāpō", points: 18 },
	{ id: "b", name: "Takahē", points: 24 },
	{ id: "c", name: "Kea", points: 12 },
	{ id: "d", name: "Tūī", points: 21 },
] as const;

export function Demo(): ReactElement {
	const [sort, setSort] = useState<{ key: Key; direction: TableSortDirection }>({ direction: "desc", key: "points" });

	const toggle = (key: Key) =>
		setSort((current) => ({
			direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
			key,
		}));

	const rows = [...TEAMS].sort((a, b) => {
		const order = sort.key === "name" ? a.name.localeCompare(b.name) : a.points - b.points;
		return sort.direction === "asc" ? order : -order;
	});

	const sortFor = (key: Key) =>
		sort.key === key ? { direction: sort.direction, onPress: () => toggle(key) } : { onPress: () => toggle(key) };

	return (
		<Table columns={[{ flex: 1 }, { width: 96, align: "end" }]} variant="outline">
			<Table.Header>
				<Table.Row>
					<Table.Head sort={sortFor("name")} testID="table-sortable-name">
						Team
					</Table.Head>
					<Table.Head sort={sortFor("points")} testID="table-sortable-points">
						Points
					</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{rows.map((team) => (
					<Table.Row key={team.id}>
						<Table.Cell>{team.name}</Table.Cell>
						<Table.Cell>{team.points}</Table.Cell>
					</Table.Row>
				))}
			</Table.Body>
		</Table>
	);
}
