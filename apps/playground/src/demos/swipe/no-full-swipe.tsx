import { IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Swipe } from "@delacour/react-native-ui/swipe";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "No full swipe",
	caption:
		"`isFullSwipe={false}` keeps a long drag from firing anything: the row only ever opens, and the action waits for a tap.",
};

export function Demo(): ReactElement {
	const [deleted, setDeleted] = useState(0);

	return (
		<ListGroup>
			<Swipe isFullSwipe={false} testID="swipe-no-full">
				<Swipe.End>
					<Swipe.Action
						color="destructive"
						icon={IconTrashCan}
						label="Delete"
						onPress={() => setDeleted((count) => count + 1)}
					/>
				</Swipe.End>
				<Item>
					<Item.Content>
						<Item.Title>Production database</Item.Title>
						<Item.Description>{`Deleted ${deleted} times`}</Item.Description>
					</Item.Content>
				</Item>
			</Swipe>
		</ListGroup>
	);
}
