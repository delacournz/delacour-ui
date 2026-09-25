import { Icon } from "@delacour/react-native-ui/icon";
import { IconFolder1, IconHeadphones, IconImages1, IconReceiptBill } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { type ReactElement, useState } from "react";
import { ScrollView } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Carousel",
	caption: "A horizontal `Item.Group` in a scroll view, each item stacked into a card.",
};

const FOLDERS = [
	{ id: "photos", title: "Photos", count: 1284, icon: IconImages1 },
	{ id: "audio", title: "Audio", count: 312, icon: IconHeadphones },
	{ id: "receipts", title: "Receipts", count: 58, icon: IconReceiptBill },
	{ id: "projects", title: "Projects", count: 17, icon: IconFolder1 },
] as const;

export function Demo(): ReactElement {
	const [open, setOpen] = useState<string>("photos");

	return (
		<ScrollView contentContainerClassName="px-1" horizontal showsHorizontalScrollIndicator={false}>
			<Item.Group orientation="horizontal">
				{FOLDERS.map((folder) => (
					<Item
						className="w-36"
						isSelected={open === folder.id}
						key={folder.id}
						onPress={() => setOpen(folder.id)}
						orientation="vertical"
						testID={`item-${folder.id}`}
						variant="outline"
					>
						<Item.Media variant="icon">
							<Icon icon={folder.icon} />
						</Item.Media>
						<Item.Content>
							<Item.Title>{folder.title}</Item.Title>
							<Item.Description>{folder.count} files</Item.Description>
						</Item.Content>
					</Item>
				))}
			</Item.Group>
		</ScrollView>
	);
}
