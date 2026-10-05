import { Text } from "@delacour/react-native-ui/text";
import { Tree } from "@delacour/react-native-ui/tree";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Single selection",
	caption:
		'`selectionMode="single"` with `expandOnPress={false}`: a row selects and only the chevron opens a branch, so a category can be picked without opening it. Pressing the selected row again keeps it selected.',
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [selected, setSelected] = useState<string | null>("clothing/tops");

	return (
		<View className="gap-3">
			<Tree
				defaultExpanded={["clothing"]}
				expandOnPress={false}
				onValueChange={setSelected}
				selectionMode="single"
				value={selected}
			>
				<Tree.Item value="clothing">
					<Tree.Trigger testID="single-clothing">Clothing</Tree.Trigger>
					<Tree.Group>
						<Tree.Item value="clothing/tops">
							<Tree.Trigger testID="single-tops">Tops</Tree.Trigger>
						</Tree.Item>
						<Tree.Item value="clothing/trousers">
							<Tree.Trigger testID="single-trousers">Trousers</Tree.Trigger>
						</Tree.Item>
					</Tree.Group>
				</Tree.Item>
				<Tree.Item value="shoes">
					<Tree.Trigger testID="single-shoes">Shoes</Tree.Trigger>
					<Tree.Group>
						<Tree.Item value="shoes/boots">
							<Tree.Trigger>Boots</Tree.Trigger>
						</Tree.Item>
						<Tree.Item value="shoes/sneakers">
							<Tree.Trigger>Sneakers</Tree.Trigger>
						</Tree.Item>
					</Tree.Group>
				</Tree.Item>
				<Tree.Item value="accessories">
					<Tree.Trigger testID="single-accessories">Accessories</Tree.Trigger>
				</Tree.Item>
			</Tree>
			<Text.Caption color="muted" testID="single-selected">
				Selected: {selected ?? "nothing"}
			</Text.Caption>
		</View>
	);
}
