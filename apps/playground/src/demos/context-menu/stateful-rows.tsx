import { ContextMenu } from "@delacour/react-native-ui/context-menu";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Checkbox and radio rows",
	caption:
		"Every Menu row works here, because they are Menu's rows. Checkboxes stay open while you toggle several; choosing a radio closes.",
	capture: { frame: "device", flow: "context-menu/stateful-rows" },
};

type Density = "compact" | "comfortable";

export function Demo(): ReactElement {
	const [isStarred, setStarred] = useState(false);
	const [isUnread, setUnread] = useState(true);
	const [density, setDensity] = useState<Density>("comfortable");

	return (
		<View className="flex-1 justify-center px-screen-gutter">
			<ContextMenu>
				<ContextMenu.Trigger testID="context-menu-stateful">
					<View className="gap-1 rounded-lg border border-border bg-card px-4 py-3">
						<Text className="font-medium text-card-foreground">Invoice #1042</Text>
						<Text className="text-muted-foreground text-sm">
							{`${isStarred ? "Starred" : "Not starred"} · ${isUnread ? "unread" : "read"} · ${density}`}
						</Text>
					</View>
				</ContextMenu.Trigger>
				<ContextMenu.Content>
					<ContextMenu.CheckboxItem
						isChecked={isStarred}
						onCheckedChange={setStarred}
						testID="context-menu-stateful-starred"
					>
						Starred
					</ContextMenu.CheckboxItem>
					<ContextMenu.CheckboxItem isChecked={isUnread} onCheckedChange={setUnread}>
						Unread
					</ContextMenu.CheckboxItem>
					<ContextMenu.Separator />
					<ContextMenu.Label isInset>Density</ContextMenu.Label>
					<ContextMenu.RadioGroup
						onValueChange={(value) => setDensity(value === "compact" ? "compact" : "comfortable")}
						value={density}
					>
						<ContextMenu.RadioItem testID="context-menu-stateful-compact" value="compact">
							Compact
						</ContextMenu.RadioItem>
						<ContextMenu.RadioItem testID="context-menu-stateful-comfortable" value="comfortable">
							Comfortable
						</ContextMenu.RadioItem>
					</ContextMenu.RadioGroup>
				</ContextMenu.Content>
			</ContextMenu>
		</View>
	);
}
