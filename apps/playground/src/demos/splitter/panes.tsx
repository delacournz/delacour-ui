import { Splitter } from "@delacour/react-native-ui/splitter";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Panes",
	align: "stretch",
	note: 'variant="panes" gives each pane its own card surface with a gap between, and draws no rule on the seam. The handle sits in the middle of the gap.',
};

export function Demo(): ReactElement {
	return (
		<Splitter className="h-64" defaultLayout={[40, 60]} variant="panes">
			<Splitter.Pane minSize={25}>
				<View className="flex-1 gap-1 p-4">
					<Text.Label>Inbox</Text.Label>
					<Text.Caption className="text-muted-foreground">12 unread</Text.Caption>
				</View>
			</Splitter.Pane>
			<Splitter.Handle accessibilityLabel="Resize inbox" testID="handle-0" />
			<Splitter.Pane minSize={30}>
				<View className="flex-1 gap-1 p-4">
					<Text.Label>Message</Text.Label>
					<Text.Caption className="text-muted-foreground">Select a conversation</Text.Caption>
				</View>
			</Splitter.Pane>
		</Splitter>
	);
}
