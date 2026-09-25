import { Icon } from "@delacour/react-native-ui/icon";
import { IconFolder1, IconHeadphones } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Media",
	caption: "A bare icon, an icon on a tile, or a clipped square for an image or an avatar.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<Item.Group>
			<Item variant="outline">
				<Item.Media>
					<Icon icon={IconFolder1} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Projects</Item.Title>
					<Item.Description>A bare icon, sized by the item</Item.Description>
				</Item.Content>
			</Item>
			<Item variant="outline">
				<Item.Media variant="icon">
					<Icon icon={IconHeadphones} />
				</Item.Media>
				<Item.Content>
					<Item.Title>Audio</Item.Title>
					<Item.Description>The glyph on a filled tile</Item.Description>
				</Item.Content>
			</Item>
			<Item variant="outline">
				<Item.Media className="rounded-full bg-primary" variant="image">
					<View className="size-full items-center justify-center">
						<Text className="font-semibold text-primary-foreground">AR</Text>
					</View>
				</Item.Media>
				<Item.Content>
					<Item.Title>Aroha Rangi</Item.Title>
					<Item.Description>A clipped square, here made round</Item.Description>
				</Item.Content>
			</Item>
		</Item.Group>
	);
}
