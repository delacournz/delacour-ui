import { Icon } from "@delacour/react-native-ui/icon";
import { IconChevronRight, IconUser } from "@delacour/react-native-ui/icons/central";
import { ITEM_SIZES, Item, type ItemSize } from "@delacour/react-native-ui/item";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "Size is set once on the item; the media, title and description follow it.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<ItemSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{ITEM_SIZES.map((size) => (
				<Item key={size} size={size} testID={`item-${size}`} variant="outline">
					<Item.Media variant="icon">
						<Icon icon={IconUser} />
					</Item.Media>
					<Item.Content>
						<Item.Title>{LABELS[size]}</Item.Title>
						<Item.Description>Name, email, phone number</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Icon icon={IconChevronRight} />
					</Item.Actions>
				</Item>
			))}
		</View>
	);
}
