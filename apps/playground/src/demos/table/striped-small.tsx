import { Table } from "@delacour/react-native-ui/table";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Striped, small",
	caption: '`size="sm"` tightens the rows and steps the type down; `striped` paints every second body row.',
};

const ROWS = [
	{ id: "mon", day: "Monday", high: 17, low: 9, rain: "10%" },
	{ id: "tue", day: "Tuesday", high: 15, low: 8, rain: "60%" },
	{ id: "wed", day: "Wednesday", high: 14, low: 7, rain: "80%" },
	{ id: "thu", day: "Thursday", high: 16, low: 9, rain: "20%" },
	{ id: "fri", day: "Friday", high: 19, low: 11, rain: "0%" },
] as const;

export function Demo(): ReactElement {
	return (
		<Table
			columns={[{ flex: 1 }, { width: 52, align: "end" }, { width: 52, align: "end" }, { width: 60, align: "end" }]}
			size="sm"
			striped
			variant="outline"
		>
			<Table.Header>
				<Table.Row>
					<Table.Head>Day</Table.Head>
					<Table.Head>High</Table.Head>
					<Table.Head>Low</Table.Head>
					<Table.Head>Rain</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{ROWS.map((row) => (
					<Table.Row key={row.id}>
						<Table.Cell>{row.day}</Table.Cell>
						<Table.Cell>{`${row.high}°`}</Table.Cell>
						<Table.Cell>{`${row.low}°`}</Table.Cell>
						<Table.Cell>{row.rain}</Table.Cell>
					</Table.Row>
				))}
			</Table.Body>
			<Table.Caption>Forecast for Wellington, in °C</Table.Caption>
		</Table>
	);
}
