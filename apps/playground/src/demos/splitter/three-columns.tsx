import { Splitter } from "@delacour/react-native-ui/splitter";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Three columns",
	note: "Any number of panes, one handle between each pair. A handle moves only the two panes either side of it, so dragging the second seam never shifts the first column.",
	capture: { align: "stretch" },
};

const COLUMNS = ["Files", "Editor", "Inspector"] as const;
const LAYOUT = [25, 50, 25];

export function Demo(): ReactElement {
	return (
		<Splitter
			className="h-64 rounded-lg border border-border border-continuous bg-card overflow-hidden"
			defaultLayout={LAYOUT}
		>
			<Splitter.Pane minSize={15}>
				<Column title={COLUMNS[0]} />
			</Splitter.Pane>
			<Splitter.Handle accessibilityLabel="Resize files" testID="handle-0" />
			<Splitter.Pane minSize={30}>
				<Column title={COLUMNS[1]} />
			</Splitter.Pane>
			<Splitter.Handle accessibilityLabel="Resize inspector" testID="handle-1" />
			<Splitter.Pane minSize={15}>
				<Column title={COLUMNS[2]} />
			</Splitter.Pane>
		</Splitter>
	);
}

function Column({ title }: { title: string }): ReactElement {
	return (
		<View className="flex-1 items-center justify-center p-2">
			<Text.Label className="text-muted-foreground" numberOfLines={1}>
				{title}
			</Text.Label>
		</View>
	);
}
