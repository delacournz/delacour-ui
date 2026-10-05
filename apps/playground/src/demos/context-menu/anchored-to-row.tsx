import { ContextMenu } from "@delacour/react-native-ui/context-menu";
import { IconPencil, IconShareOs, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anchored to the row",
	caption:
		'`anchor="target"` hangs the panel off the whole row rather than the finger, lined up with its leading edge — wherever on the row the hold landed.',
	capture: { frame: "device", flow: "context-menu/anchored-to-row" },
};

const FILES = ["Brief.pdf", "Moodboard.fig", "Budget.xlsx"] as const;

export function Demo(): ReactElement {
	return (
		<View className="flex-1 justify-center px-screen-gutter">
			<View className="overflow-hidden rounded-lg border border-border">
				{FILES.map((file, index) => (
					<ContextMenu key={file}>
						<ContextMenu.Trigger anchor="target" testID={`context-menu-row-${index}`}>
							<View className={index === 0 ? "bg-card px-4 py-3" : "border-border border-t bg-card px-4 py-3"}>
								<Text className="text-card-foreground">{file}</Text>
							</View>
						</ContextMenu.Trigger>
						<ContextMenu.Content>
							<ContextMenu.Label>{file}</ContextMenu.Label>
							<ContextMenu.Item icon={IconPencil} testID={`context-menu-row-${index}-rename`}>
								Rename
							</ContextMenu.Item>
							<ContextMenu.Item icon={IconShareOs}>Share</ContextMenu.Item>
							<ContextMenu.Separator />
							<ContextMenu.Item icon={IconTrashCan} variant="destructive">
								Delete
							</ContextMenu.Item>
						</ContextMenu.Content>
					</ContextMenu>
				))}
			</View>
		</View>
	);
}
