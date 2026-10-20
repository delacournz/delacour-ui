import { Card } from "@delacour/react-native-ui/card";
import { SplitView } from "@delacour/react-native-ui/split-view";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Seam",
	note: 'variant="seam" drops the pane surfaces and draws a hairline behind the grip, for a split that already sits on a card or a sheet.',
	capture: { align: "stretch", flow: true },
};

export function Demo(): ReactElement {
	return (
		<Card className="overflow-hidden p-0">
			<SplitView className="h-96" variant="seam">
				<SplitView.Top testID="pane-top">
					<View className="flex-1 gap-1 p-4">
						<Text.Label>Revenue</Text.Label>
						<Text.Caption className="text-muted-foreground">The chart lives here.</Text.Caption>
					</View>
				</SplitView.Top>
				<SplitView.DragArea accessibilityLabel="Resize chart" testID="drag-area" />
				<SplitView.Bottom testID="pane-bottom">
					<View className="flex-1 gap-1 p-4">
						<Text.Label>Table</Text.Label>
						<Text.Caption className="text-muted-foreground">And its rows here.</Text.Caption>
					</View>
				</SplitView.Bottom>
			</SplitView>
		</Card>
	);
}
