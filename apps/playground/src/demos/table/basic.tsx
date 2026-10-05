import { Table } from "@delacour/react-native-ui/table";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"Columns are declared once on the table and every row reads them by position, so the header, the line items and the total line up.",
	capture: { align: "stretch", hero: true },
};

const LINES = [
	{ id: "flat-white", item: "Flat white", qty: 2, total: "$11.00" },
	{ id: "croissant", item: "Almond croissant", qty: 1, total: "$6.50" },
	{ id: "water", item: "Sparkling water", qty: 3, total: "$12.00" },
] as const;

export function Demo(): ReactElement {
	return (
		<Table columns={[{ flex: 1 }, { width: 56, align: "end" }, { width: 88, align: "end" }]} variant="outline">
			<Table.Header>
				<Table.Row>
					<Table.Head>Item</Table.Head>
					<Table.Head>Qty</Table.Head>
					<Table.Head>Total</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{LINES.map((line) => (
					<Table.Row key={line.id}>
						<Table.Cell>{line.item}</Table.Cell>
						<Table.Cell>{line.qty}</Table.Cell>
						<Table.Cell>{line.total}</Table.Cell>
					</Table.Row>
				))}
			</Table.Body>
			<Table.Footer>
				<Table.Row>
					<Table.Cell>Total</Table.Cell>
					<Table.Cell>6</Table.Cell>
					<Table.Cell>$29.50</Table.Cell>
				</Table.Row>
			</Table.Footer>
		</Table>
	);
}
