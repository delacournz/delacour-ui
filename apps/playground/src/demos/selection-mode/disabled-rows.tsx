import { Icon } from "@delacour/react-native-ui/icon";
import { IconFolder1, IconLock } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { SelectionMode } from "@delacour/react-native-ui/selection-mode";
import { type ReactElement, useState } from "react";
import { ScrollView, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled rows",
	caption:
		"A locked folder can never be picked and never starts the mode. Load more is disabled too, so it keeps its own press while the mode is on.",
};

type Folder = { id: string; title: string; isLocked: boolean };

const FOLDERS: readonly Folder[] = [
	{ id: "f1", title: "Receipts", isLocked: false },
	{ id: "f2", title: "Shared with me", isLocked: true },
	{ id: "f3", title: "Projects", isLocked: false },
	{ id: "f4", title: "System", isLocked: true },
];

const MORE: readonly Folder[] = [
	{ id: "f5", title: "Archive 2025", isLocked: false },
	{ id: "f6", title: "Scans", isLocked: false },
];

export function Demo(): ReactElement {
	const [folders, setFolders] = useState<readonly Folder[]>(FOLDERS);
	const isFull = folders.length > FOLDERS.length;

	return (
		<View className="h-[480px]">
			<SelectionMode values={folders.filter((folder) => !folder.isLocked).map((folder) => folder.id)}>
				<SelectionMode.Header title="Folders" />
				<ScrollView contentContainerClassName="pt-3">
					<SelectionMode.Group>
						{folders.map((folder) => (
							<SelectionMode.Item
								isDisabled={folder.isLocked}
								key={folder.id}
								testID={`folder-${folder.id}`}
								value={folder.id}
							>
								<Item isDisabled={folder.isLocked}>
									<Item.Media variant="icon">
										<Icon icon={folder.isLocked ? IconLock : IconFolder1} />
									</Item.Media>
									<Item.Content>
										<Item.Title>{folder.title}</Item.Title>
									</Item.Content>
								</Item>
							</SelectionMode.Item>
						))}
						{isFull ? null : (
							<SelectionMode.Item
								indicator="none"
								isDisabled
								onPress={() => setFolders((list) => [...list, ...MORE])}
								testID="load-more"
								value="load-more"
							>
								<Item>
									<Item.Content>
										<Item.Title className="text-primary">Load more</Item.Title>
									</Item.Content>
								</Item>
							</SelectionMode.Item>
						)}
					</SelectionMode.Group>
				</ScrollView>
			</SelectionMode>
		</View>
	);
}
