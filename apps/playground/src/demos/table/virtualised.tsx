import { Table } from "@delacour/react-native-ui/table";
import type { ReactElement } from "react";
import { FlatList } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Virtualised",
	caption:
		"A long table renders its rows from a `FlatList`. With no body around them, each row takes `index` and `isLast` itself, so it still stripes and drops its last hairline.",
};

type Entry = { id: string; name: string; score: number };

const ENTRIES: readonly Entry[] = Array.from({ length: 200 }, (_, index) => ({
	id: `player-${index + 1}`,
	name: `Player ${index + 1}`,
	score: 10_000 - index * 37,
}));

export function Demo(): ReactElement {
	return (
		<Table
			className="h-96"
			columns={[{ width: 48, align: "end" }, { flex: 1 }, { width: 80, align: "end" }]}
			striped
			variant="outline"
		>
			<Table.Header>
				<Table.Row>
					<Table.Head>#</Table.Head>
					<Table.Head>Name</Table.Head>
					<Table.Head>Score</Table.Head>
				</Table.Row>
			</Table.Header>
			<FlatList
				data={ENTRIES}
				keyExtractor={(entry) => entry.id}
				renderItem={({ item, index }) => (
					<Table.Row index={index} isLast={index === ENTRIES.length - 1}>
						<Table.Cell>{index + 1}</Table.Cell>
						<Table.Cell>{item.name}</Table.Cell>
						<Table.Cell>{item.score.toLocaleString()}</Table.Cell>
					</Table.Row>
				)}
				testID="table-virtualised-list"
			/>
		</Table>
	);
}
