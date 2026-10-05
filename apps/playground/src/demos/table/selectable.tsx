import { Table } from "@delacour/react-native-ui/table";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Selectable",
	caption:
		"With `onPress` a row is one button, named by all of its cells. `isSelected` paints it on the accent; `isDisabled` fades its cells and blocks the press.",
};

const INVOICES = [
	{ id: "INV-041", client: "Harbour Café", amount: "$1,240.00", disabled: false },
	{ id: "INV-042", client: "Ridgeline Ltd", amount: "$860.50", disabled: false },
	{ id: "INV-043", client: "Kōwhai Studio", amount: "$3,105.00", disabled: true },
	{ id: "INV-044", client: "Southern Freight", amount: "$412.75", disabled: false },
] as const;

export function Demo(): ReactElement {
	const [selected, setSelected] = useState<string>("INV-042");

	return (
		<Table columns={[{ width: 84 }, { flex: 1 }, { width: 96, align: "end" }]} variant="outline">
			<Table.Header>
				<Table.Row>
					<Table.Head>Invoice</Table.Head>
					<Table.Head>Client</Table.Head>
					<Table.Head>Amount</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{INVOICES.map((invoice) => (
					<Table.Row
						haptic="selection"
						isDisabled={invoice.disabled}
						isSelected={invoice.id === selected}
						key={invoice.id}
						onPress={() => setSelected(invoice.id)}
						testID={`table-selectable-${invoice.id}`}
					>
						<Table.Cell>{invoice.id}</Table.Cell>
						<Table.Cell>{invoice.client}</Table.Cell>
						<Table.Cell>{invoice.amount}</Table.Cell>
					</Table.Row>
				))}
			</Table.Body>
		</Table>
	);
}
