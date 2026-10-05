import { Button } from "@delacour/react-native-ui/button";
import { SplitView, useSplitView } from "@delacour/react-native-ui/split-view";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	note: "Pass snapIndex and onSnapIndexChange to own the stop. useSplitView() hands a child the same index and snapTo, so a toolbar inside a pane can move the divider.",
	capture: { align: "stretch", flow: "split-view/controlled" },
};

const STOPS = ["Small", "Medium", "Large"] as const;

function Toolbar(): ReactElement {
	const { snapIndex, snapTo } = useSplitView();
	return (
		<View className="flex-row gap-2 p-3">
			{STOPS.map((label, index) => (
				<Button
					isDisabled={index === snapIndex}
					key={label}
					onPress={() => snapTo(index)}
					size="sm"
					testID={`snap-${index}`}
					variant="secondary"
				>
					<Button.Label>{label}</Button.Label>
				</Button>
			))}
		</View>
	);
}

export function Demo(): ReactElement {
	const [index, setIndex] = useState(1);
	return (
		<View className="gap-3">
			<SplitView className="h-[420px]" onSnapIndexChange={setIndex} snapIndex={index}>
				<SplitView.Top testID="pane-top">
					<Toolbar />
				</SplitView.Top>
				<SplitView.DragArea testID="drag-area" />
				<SplitView.Bottom testID="pane-bottom" />
			</SplitView>
			<Text.Caption className="text-center text-muted-foreground" testID="snap-readout">
				{`snapIndex ${index}`}
			</Text.Caption>
		</View>
	);
}
