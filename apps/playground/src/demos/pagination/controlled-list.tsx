import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Pagination } from "@delacour/react-native-ui/pagination";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled list",
	caption: "The pagination owns the arithmetic; the screen owns the slice. Five rows a page across 470 orders.",
	capture: { align: "stretch", flow: true },
};

const PAGE_SIZE = 5;
const ORDERS = Array.from({ length: 470 }, (_, index) => `Order #${String(10001 + index)}`);

export function Demo(): ReactElement {
	const [page, setPage] = useState(1);
	const rows = ORDERS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	return (
		<View className="gap-4">
			<ListGroup>
				{rows.map((order) => (
					<ListGroup.Item key={order}>{order}</ListGroup.Item>
				))}
			</ListGroup>
			<Pagination
				count={Math.ceil(ORDERS.length / PAGE_SIZE)}
				onPageChange={setPage}
				page={page}
				size="sm"
				testID="pagination-list"
			/>
		</View>
	);
}
