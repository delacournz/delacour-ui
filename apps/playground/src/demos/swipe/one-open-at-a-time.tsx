import { IconBell2Snooze, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Swipe } from "@delacour/react-native-ui/swipe";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "One open at a time",
	caption:
		"Rows inside a `Swipe.Group` register with it, however deeply they are nested. Opening one closes whichever was open.",
};

const REMINDERS = ["Water the plants", "Call the bank", "Book the dentist"] as const;

export function Demo(): ReactElement {
	return (
		<Swipe.Group>
			<ListGroup>
				{REMINDERS.map((title) => (
					<Swipe key={title} testID={`swipe-${title}`}>
						<Swipe.End>
							<Swipe.Action color="warning" icon={IconBell2Snooze} label="Snooze" onPress={() => {}} />
							<Swipe.Action color="destructive" icon={IconTrashCan} label="Delete" onPress={() => {}} />
						</Swipe.End>
						<Item>
							<Item.Content>
								<Item.Title>{title}</Item.Title>
							</Item.Content>
						</Item>
					</Swipe>
				))}
			</ListGroup>
		</Swipe.Group>
	);
}
