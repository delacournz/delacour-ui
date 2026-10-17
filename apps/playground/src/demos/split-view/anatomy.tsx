import { SplitView } from "@delacour/react-native-ui/split-view";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	note: "SplitView.Top, SplitView.DragArea and SplitView.Bottom, in that order. Drag the row: the top pane follows the finger and settles on the nearest of three stops, or the next one along when flicked. Tap the grip to cycle.",
	capture: { align: "stretch", flow: "split-view/anatomy", hero: true },
};

const RESULTS = ["Harbour Café", "Kelburn Park", "Cuba Street", "Te Papa", "Oriental Bay"] as const;

export function Demo(): ReactElement {
	return (
		<SplitView className="h-[480px]" snapPoints={[0.3, 0.6, 1]}>
			<SplitView.Top testID="pane-top">
				<View className="flex-1 items-center justify-center bg-muted">
					<Text.Label className="text-muted-foreground">Map</Text.Label>
				</View>
			</SplitView.Top>
			<SplitView.DragArea accessibilityLabel="Resize map" testID="drag-area" />
			<SplitView.Bottom testID="pane-bottom">
				<View className="gap-3 p-4">
					{RESULTS.map((name) => (
						<Text.Paragraph key={name}>{name}</Text.Paragraph>
					))}
				</View>
			</SplitView.Bottom>
		</SplitView>
	);
}
