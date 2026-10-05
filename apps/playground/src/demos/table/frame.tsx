import { Badge } from "@delacour/react-native-ui/badge";
import { Button } from "@delacour/react-native-ui/button";
import { Table } from "@delacour/react-native-ui/table";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Frame",
	caption:
		"`Table.Frame` is a card with a title, a description and an action, holding the table flush to its sides and bottom.",
	align: "stretch",
};

const PAYMENTS = [
	{ id: "p1", client: "Harbour Café", status: "Paid", amount: "$1,240" },
	{ id: "p2", client: "Ridgeline Ltd", status: "Due", amount: "$860" },
	{ id: "p3", client: "Southern Freight", status: "Paid", amount: "$412" },
] as const;

export function Demo(): ReactElement {
	return (
		<Table.Frame
			action={
				<Button size="sm" variant="outline">
					Export
				</Button>
			}
			description="Last 30 days"
			title="Payments"
		>
			<Table columns={[{ flex: 1 }, { width: 88, align: "center" }, { width: 100, align: "end" }]} striped>
				<Table.Header>
					<Table.Row>
						<Table.Head>Client</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Amount</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{PAYMENTS.map((payment) => (
						<Table.Row key={payment.id}>
							<Table.Cell>{payment.client}</Table.Cell>
							<Table.Cell accessibilityLabel={`Status, ${payment.status}`}>
								<Badge color={payment.status === "Paid" ? "success" : "warning"} size="sm" variant="soft">
									{payment.status}
								</Badge>
							</Table.Cell>
							<Table.Cell>{payment.amount}</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table>
		</Table.Frame>
	);
}
