import { SplitView } from "@delacour/react-native-ui/split-view";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scrolling panes",
	note: "The gesture lives on the drag row alone, so a list in a pane scrolls without ever moving the divider, and the row wins a drag that starts on it.",
	capture: { align: "stretch", flow: true },
};

const ROWS = Array.from({ length: 30 }, (_, index) => `Comment ${index + 1}`);

export function Demo(): ReactElement {
	return (
		<SplitView className="h-[480px]" minBottomHeight={120} minTopHeight={80}>
			<SplitView.Top testID="pane-top">
				<View className="flex-1 gap-1 p-4">
					<Text.Label>Document</Text.Label>
					<Text.Caption className="text-muted-foreground">Drag the row to give the comments more room.</Text.Caption>
				</View>
			</SplitView.Top>
			<SplitView.DragArea accessibilityLabel="Resize comments" testID="drag-area" />
			<SplitView.Bottom testID="pane-bottom">
				<ScrollView contentContainerClassName="gap-3 p-4" nestedScrollEnabled testID="comments">
					{ROWS.map((row) => (
						<Text.Paragraph key={row}>{row}</Text.Paragraph>
					))}
				</ScrollView>
			</SplitView.Bottom>
		</SplitView>
	);
}
