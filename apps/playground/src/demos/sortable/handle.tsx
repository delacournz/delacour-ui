import { Item } from "@delacour/react-native-ui/item";
import { Sortable } from "@delacour/react-native-ui/sortable";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	align: "stretch",
	title: "Handle",
	caption:
		"Drag a row by its grip. The rows it passes step aside on the UI thread, and `onReorder` hears the new order once, after the row lands.",
};

const TRACKS: Record<string, { title: string; artist: string }> = {
	dawn: { title: "Dawn Chorus", artist: "The Harbour" },
	tide: { title: "Low Tide", artist: "Saltwater" },
	ember: { title: "Ember", artist: "North Ridge" },
	lantern: { title: "Lanterns", artist: "Kōwhai" },
	drift: { title: "Drift", artist: "Pale Moth" },
};

export function Demo(): ReactElement {
	const [order, setOrder] = useState(["dawn", "tide", "ember", "lantern", "drift"]);

	return (
		<Sortable gap={8} onReorder={setOrder} testID="sortable-handle" value={order}>
			{order.map((id) => (
				<Sortable.Item id={id} key={id}>
					<Item variant="outline">
						<Item.Content>
							<Item.Title>{TRACKS[id]?.title}</Item.Title>
							<Item.Description>{TRACKS[id]?.artist}</Item.Description>
						</Item.Content>
						<Item.Actions>
							<Sortable.Handle testID={`sortable-handle-${id}`} />
						</Item.Actions>
					</Item>
				</Sortable.Item>
			))}
		</Sortable>
	);
}
