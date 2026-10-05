import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Sortable } from "@delacour/react-native-ui/sortable";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	align: "stretch",
	title: "In a list group",
	caption:
		"Rows inside one `ListGroup` card. The lifted row takes an opaque card surface and a shadow, so the row it passes never shows through.",
};

const TABS: Record<string, string> = {
	home: "Home",
	search: "Search",
	library: "Library",
	profile: "Profile",
};

export function Demo(): ReactElement {
	const [order, setOrder] = useState(["home", "search", "library", "profile"]);

	return (
		<ListGroup>
			<Sortable onReorder={setOrder} value={order}>
				{order.map((id) => (
					<Sortable.Item id={id} key={id}>
						<ListGroup.Item>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{TABS[id]}</ListGroup.ItemTitle>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix>
								<Sortable.Handle testID={`sortable-list-group-${id}`} />
							</ListGroup.ItemSuffix>
						</ListGroup.Item>
					</Sortable.Item>
				))}
			</Sortable>
		</ListGroup>
	);
}
