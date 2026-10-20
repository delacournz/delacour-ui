import { Splitter } from "@delacour/react-native-ui/splitter";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Vertical",
	note: 'orientation="vertical" stacks the panes and drags along y. Sizes are still percentages of the box, so the layout survives a rotation untouched.',
	capture: { align: "stretch", flow: true },
};

export function Demo(): ReactElement {
	return (
		<Splitter
			className="h-80 rounded-lg border border-border border-continuous bg-card overflow-hidden"
			defaultLayout={[60, 40]}
			orientation="vertical"
		>
			<Splitter.Pane minSize={25}>
				<View className="flex-1 gap-1 p-4">
					<Text.Label>Editor</Text.Label>
					<Text.Code className="text-muted-foreground">{'<Splitter orientation="vertical">'}</Text.Code>
				</View>
			</Splitter.Pane>
			<Splitter.Handle accessibilityLabel="Resize editor" testID="handle-0" />
			<Splitter.Pane minSize={20}>
				<View className="flex-1 items-center justify-center p-4">
					<Text.Label className="text-muted-foreground">Preview</Text.Label>
				</View>
			</Splitter.Pane>
		</Splitter>
	);
}
