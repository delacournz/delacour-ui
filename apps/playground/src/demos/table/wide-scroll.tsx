import { Table } from "@delacour/react-native-ui/table";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Wide",
	caption:
		"A `minWidth` wider than the screen scrolls sideways, with a fade at each edge that has more columns past it.",
	capture: { align: "stretch", flow: true },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] as const;

const REGIONS = [
	{ id: "akl", name: "Auckland", sales: [42, 38, 51, 47, 55, 60] },
	{ id: "wlg", name: "Wellington", sales: [31, 29, 33, 36, 34, 39] },
	{ id: "chc", name: "Christchurch", sales: [27, 30, 28, 32, 35, 33] },
] as const;

const COLUMNS = [{ width: 132 }, ...MONTHS.map(() => ({ flex: 1, align: "end" as const }))];

export function Demo(): ReactElement {
	return (
		<Table columns={COLUMNS} minWidth={640} testID="table-wide" variant="outline">
			<Table.Header>
				<Table.Row>
					<Table.Head>Region</Table.Head>
					{MONTHS.map((month) => (
						<Table.Head key={month}>{month}</Table.Head>
					))}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{REGIONS.map((region) => (
					<Table.Row key={region.id}>
						<Table.Cell>{region.name}</Table.Cell>
						{region.sales.map((value, month) => (
							<Table.Cell key={MONTHS[month]}>{`$${value}k`}</Table.Cell>
						))}
					</Table.Row>
				))}
			</Table.Body>
		</Table>
	);
}
