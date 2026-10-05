import { Button } from "@delacour/react-native-ui/button";
import { Table } from "@delacour/react-native-ui/table";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Empty",
	caption:
		"`Table.Empty` sits inside the body beside the `.map()`, and shows only when the map produces no rows. The header stays.",
};

const ORDERS = [
	{ id: "1042", status: "Shipped" },
	{ id: "1043", status: "Packing" },
] as const;

export function Demo(): ReactElement {
	const [isCleared, setIsCleared] = useState(true);
	const rows = isCleared ? [] : ORDERS;

	return (
		<View className="gap-4">
			<Table columns={[{ flex: 1 }, { flex: 1, align: "end" }]} variant="outline">
				<Table.Header>
					<Table.Row>
						<Table.Head>Order</Table.Head>
						<Table.Head>Status</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{rows.map((order) => (
						<Table.Row key={order.id}>
							<Table.Cell>{`#${order.id}`}</Table.Cell>
							<Table.Cell>{order.status}</Table.Cell>
						</Table.Row>
					))}
					<Table.Empty>No orders yet</Table.Empty>
				</Table.Body>
			</Table>
			<Button onPress={() => setIsCleared(!isCleared)} size="sm" testID="table-empty-toggle" variant="outline">
				{isCleared ? "Load orders" : "Clear orders"}
			</Button>
		</View>
	);
}
