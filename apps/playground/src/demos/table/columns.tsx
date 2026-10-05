import { Table } from "@delacour/react-native-ui/table";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Columns",
	caption:
		"`{ flex }` columns share what the fixed ones leave, by weight; `{ width }` columns are exact. Each takes an `align`, and a cell's `column` prop overrides its own.",
};

const FIXTURES = [
	{ id: "1", home: "Wellington", away: "Auckland", score: "2 – 1", round: 1 },
	{ id: "2", home: "Christchurch", away: "Dunedin", score: "0 – 0", round: 1 },
	{ id: "3", home: "Hamilton", away: "Napier", score: "3 – 2", round: 2 },
] as const;

export function Demo(): ReactElement {
	return (
		<Table
			columns={[{ width: 40, align: "center" }, { flex: 2 }, { width: 64, align: "center" }, { flex: 2, align: "end" }]}
			variant="outline"
		>
			<Table.Header>
				<Table.Row>
					<Table.Head>Rd</Table.Head>
					<Table.Head>Home</Table.Head>
					<Table.Head>Score</Table.Head>
					<Table.Head>Away</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{FIXTURES.map((fixture) => (
					<Table.Row key={fixture.id}>
						<Table.Cell>{fixture.round}</Table.Cell>
						<Table.Cell>{fixture.home}</Table.Cell>
						<Table.Cell labelClassName="font-semibold">{fixture.score}</Table.Cell>
						<Table.Cell>{fixture.away}</Table.Cell>
					</Table.Row>
				))}
			</Table.Body>
		</Table>
	);
}
