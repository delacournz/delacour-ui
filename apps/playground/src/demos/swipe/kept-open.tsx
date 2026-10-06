import { IconBookmark, IconBookmarkCheck } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Swipe } from "@delacour/react-native-ui/swipe";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Kept open",
	caption:
		"`isKeptOpen` leaves the row open after the action runs, so a toggle can be flipped and checked in one place. Tap the row to close it.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [isSaved, setIsSaved] = useState(false);

	return (
		<ListGroup>
			<Swipe isFullSwipe={false} testID="swipe-kept-open">
				<Swipe.End>
					<Swipe.Action
						color="primary"
						icon={isSaved ? IconBookmarkCheck : IconBookmark}
						isKeptOpen
						label={isSaved ? "Saved" : "Save"}
						onPress={() => setIsSaved((value) => !value)}
					/>
				</Swipe.End>
				<Item>
					<Item.Content>
						<Item.Title>Designing for thumbs</Item.Title>
						<Item.Description>{isSaved ? "In your reading list" : "Not saved"}</Item.Description>
					</Item.Content>
				</Item>
			</Swipe>
		</ListGroup>
	);
}
