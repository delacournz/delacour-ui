import { Item } from "@delacour/react-native-ui/item";
import { Sortable } from "@delacour/react-native-ui/sortable";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	align: "stretch",
	title: "Long press",
	caption:
		'`activation="long-press"` lifts the whole row after a hold. The grip stays as a hint; the row is what a screen reader focuses, with Move up and Move down.',
	capture: { align: "stretch", flow: true },
};

const SHORTCUTS: Record<string, string> = {
	scan: "Scan a document",
	timer: "Start a timer",
	note: "New note",
	call: "Call home",
};

export function Demo(): ReactElement {
	const [order, setOrder] = useState(["scan", "timer", "note", "call"]);

	return (
		<Sortable activation="long-press" gap={8} onReorder={setOrder} value={order}>
			{order.map((id) => (
				<Sortable.Item id={id} key={id} testID={`sortable-long-press-${id}`}>
					<Item variant="muted">
						<Item.Content>
							<Item.Title>{SHORTCUTS[id]}</Item.Title>
						</Item.Content>
						<Item.Actions>
							<Sortable.Handle />
						</Item.Actions>
					</Item>
				</Sortable.Item>
			))}
		</Sortable>
	);
}
