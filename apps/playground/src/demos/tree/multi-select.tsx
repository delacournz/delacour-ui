import { Icon } from "@delacour/react-native-ui/icon";
import { IconCheckCircle2, IconCircle } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { Tree, useTreeItem } from "@delacour/react-native-ui/tree";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Multiple selection",
	caption:
		'`selectionMode="multiple"` toggles each row in a flat set — selecting a branch does not select its children. The check glyph is drawn from `useTreeItem`, not a nested control, so the row stays one tap target.',
	capture: { align: "stretch" },
};

/** A check that follows the row's selection. */
function Check(): ReactElement {
	const { isSelected } = useTreeItem();
	return <Icon icon={isSelected ? IconCheckCircle2 : IconCircle} />;
}

function Row({ value, label }: { value: string; label: string }): ReactElement {
	return (
		<Tree.Item value={value}>
			<Tree.Trigger testID={`multi-${value}`}>
				<Tree.Icon>
					<Check />
				</Tree.Icon>
				<Tree.Label>{label}</Tree.Label>
			</Tree.Trigger>
		</Tree.Item>
	);
}

export function Demo(): ReactElement {
	const [selected, setSelected] = useState<string[]>(["email", "push"]);

	return (
		<View className="gap-3">
			<Tree
				defaultExpanded={["messages"]}
				expandOnPress={false}
				onValueChange={setSelected}
				selectionMode="multiple"
				value={selected}
			>
				<Tree.Item value="messages">
					<Tree.Trigger testID="multi-messages">
						<Tree.Icon>
							<Check />
						</Tree.Icon>
						<Tree.Label>Messages</Tree.Label>
					</Tree.Trigger>
					<Tree.Group>
						<Row label="Email" value="email" />
						<Row label="Push" value="push" />
						<Row label="SMS" value="sms" />
					</Tree.Group>
				</Tree.Item>
				<Row label="Weekly digest" value="digest" />
			</Tree>
			<Text.Caption color="muted" testID="multi-selected">
				{selected.length} selected
			</Text.Caption>
		</View>
	);
}
