import { Button } from "@delacour/react-native-ui/button";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Vertical and separated",
	caption:
		"An attached group is a `Button.Group`, so it runs either way and takes a `Button.Group.Separator` between two members — the ends stay rounded.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-start gap-6">
			<ToggleButton.Group
				defaultSelected={["inbox"]}
				orientation="vertical"
				selectionMode="single"
				testID="vertical-group"
				variant="outline"
			>
				<ToggleButton testID="vertical-inbox" value="inbox">
					Inbox
				</ToggleButton>
				<ToggleButton testID="vertical-archive" value="archive">
					Archive
				</ToggleButton>
				<ToggleButton testID="vertical-spam" value="spam">
					Spam
				</ToggleButton>
			</ToggleButton.Group>
			<ToggleButton.Group defaultSelected={["grid"]} selectionMode="single" testID="separated-group" variant="outline">
				<ToggleButton testID="separated-grid" value="grid">
					Grid
				</ToggleButton>
				<Button.Group.Separator />
				<ToggleButton testID="separated-list" value="list">
					List
				</ToggleButton>
			</ToggleButton.Group>
		</View>
	);
}
