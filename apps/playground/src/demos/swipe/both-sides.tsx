import { IconBell2Snooze, IconCheckmark2, IconFlag1, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Swipe } from "@delacour/react-native-ui/swipe";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Both sides",
	caption:
		"`Swipe.Start` and `Swipe.End` hold separate actions. The edge text runs toward is always `end`, so the layout mirrors right to left.",
	capture: { align: "stretch", flow: "swipe/both-sides", hero: true },
};

export function Demo(): ReactElement {
	const [status, setStatus] = useState("Swipe either way");

	return (
		<ListGroup>
			<Swipe testID="swipe-both-sides">
				<Swipe.Start>
					<Swipe.Action color="success" icon={IconCheckmark2} label="Done" onPress={() => setStatus("Done")} />
					<Swipe.Action color="info" icon={IconFlag1} label="Flag" onPress={() => setStatus("Flagged")} />
				</Swipe.Start>
				<Swipe.End>
					<Swipe.Action color="warning" icon={IconBell2Snooze} label="Snooze" onPress={() => setStatus("Snoozed")} />
					<Swipe.Action color="destructive" icon={IconTrashCan} label="Delete" onPress={() => setStatus("Deleted")} />
				</Swipe.End>
				<Item>
					<Item.Content>
						<Item.Title>Quarterly report</Item.Title>
						<Item.Description>{status}</Item.Description>
					</Item.Content>
				</Item>
			</Swipe>
		</ListGroup>
	);
}
