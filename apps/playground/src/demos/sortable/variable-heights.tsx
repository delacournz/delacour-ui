import { Item } from "@delacour/react-native-ui/item";
import { Sortable } from "@delacour/react-native-ui/sortable";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variable heights",
	caption:
		"Each row measures itself. A row changes slot as soon as its edge crosses the middle of the next one, however tall either is.",
};

const STEPS: Record<string, { title: string; detail?: string }> = {
	prep: {
		title: "Preheat the oven",
		detail: "220°C, fan off, with the tray inside so it is hot when the dough goes on.",
	},
	mix: { title: "Mix the dough" },
	rest: {
		title: "Rest",
		detail:
			"Cover and leave somewhere warm for an hour, until doubled. A cold kitchen can take twice as long — go by the size, not the clock.",
	},
	shape: { title: "Shape" },
	bake: { title: "Bake", detail: "Twenty-five minutes, turning the tray halfway." },
};

export function Demo(): ReactElement {
	const [order, setOrder] = useState(["prep", "mix", "rest", "shape", "bake"]);

	return (
		<Sortable gap={8} onReorder={setOrder} value={order}>
			{order.map((id) => (
				<Sortable.Item id={id} key={id}>
					<Item variant="outline">
						<Item.Content>
							<Item.Title>{STEPS[id]?.title}</Item.Title>
							{STEPS[id]?.detail ? <Item.Description>{STEPS[id]?.detail}</Item.Description> : null}
						</Item.Content>
						<Item.Actions>
							<Sortable.Handle testID={`sortable-variable-${id}`} />
						</Item.Actions>
					</Item>
				</Sortable.Item>
			))}
		</Sortable>
	);
}
