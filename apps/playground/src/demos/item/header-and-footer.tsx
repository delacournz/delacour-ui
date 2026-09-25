import { Badge } from "@delacour/react-native-ui/badge";
import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCalendar1, IconHeart } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Header and footer",
	caption:
		'Full-width strips above and below the content, on a row or on a card stacked with `orientation="vertical"`.',
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [isGoing, setIsGoing] = useState(false);
	const [isSaved, setIsSaved] = useState(false);

	return (
		<Item.Group>
			<Item variant="outline">
				<Item.Header>
					<Text.Caption>Tomorrow · 7:30 pm</Text.Caption>
					<Badge color={isGoing ? "success" : "default"} variant="soft">
						{isGoing ? "Going" : "Invited"}
					</Badge>
				</Item.Header>
				<Item.Media variant="icon">
					<Icon icon={IconCalendar1} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Design review</Item.Title>
					<Item.Description>Level 3, the long table</Item.Description>
				</Item.Content>
				<Item.Footer>
					<Button
						className="flex-1"
						onPress={() => setIsGoing((value) => !value)}
						size="sm"
						testID="button-rsvp"
						variant={isGoing ? "secondary" : "primary"}
					>
						<Button.Label>{isGoing ? "Can't go" : "Accept"}</Button.Label>
					</Button>
				</Item.Footer>
			</Item>
			<Item orientation="vertical" variant="muted">
				<Item.Header>
					<Text.Caption>Article · 6 min</Text.Caption>
					<Button
						accessibilityLabel={isSaved ? "Unsave" : "Save"}
						onPress={() => setIsSaved((value) => !value)}
						size="icon-sm"
						testID="button-save"
						variant="ghost"
					>
						<Icon color={isSaved ? "destructive" : undefined} icon={IconHeart} />
					</Button>
				</Item.Header>
				<Item.Content>
					<Item.Title>Why rows should share their padding</Item.Title>
					<Item.Description numberOfLines={2}>
						A divider inset by the row padding only lines up when every row agrees on what that padding is.
					</Item.Description>
				</Item.Content>
				<Item.Footer>
					<Text.Caption>{isSaved ? "Saved to your list" : "Tap the heart to save"}</Text.Caption>
				</Item.Footer>
			</Item>
		</Item.Group>
	);
}
