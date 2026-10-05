import { SplitView, useSplitView } from "@delacour/react-native-ui/split-view";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Snap points",
	note: "A stop at or below 1 is a fraction of the box; above 1 it is points. [120, 0.5, 1] mixes both: a fixed 120pt peek, half, and everything.",
	capture: { align: "stretch", flow: "split-view/snap-points" },
};

const LABELS = ["120pt", "Half", "All"] as const;

function StopLabel(): ReactElement {
	const { snapIndex } = useSplitView();
	return (
		<View className="flex-1 items-center justify-center bg-muted">
			<Text.Label className="text-muted-foreground">{LABELS[snapIndex] ?? ""}</Text.Label>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<SplitView className="h-[420px]" defaultSnapIndex={0} snapPoints={[120, 0.5, 1]}>
			<SplitView.Top testID="pane-top">
				<StopLabel />
			</SplitView.Top>
			<SplitView.DragArea testID="drag-area" />
			<SplitView.Bottom testID="pane-bottom">
				<View className="flex-1 items-center justify-center">
					<Text.Label className="text-muted-foreground">Details</Text.Label>
				</View>
			</SplitView.Bottom>
		</SplitView>
	);
}
