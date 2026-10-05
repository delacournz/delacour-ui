import { Splitter, type SplitterLayout } from "@delacour/react-native-ui/splitter";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	note: "Pass layout and onLayoutChange to own the sizes. onLayoutChange fires once per release, never per frame, so it is the place to persist a layout.",
};

function format(layout: SplitterLayout): string {
	return layout.map((size) => `${Math.round(size)}%`).join(" · ");
}

export function Demo(): ReactElement {
	const [layout, setLayout] = useState<SplitterLayout>([30, 70]);
	return (
		<View className="gap-3">
			<Splitter
				className="h-48 rounded-lg border border-border border-continuous bg-card overflow-hidden"
				layout={layout}
				onLayoutChange={setLayout}
			>
				<Splitter.Pane minSize={20} />
				<Splitter.Handle testID="handle-0" />
				<Splitter.Pane minSize={20} />
			</Splitter>
			<Text.Caption className="text-center text-muted-foreground" testID="layout-readout">
				{format(layout)}
			</Text.Caption>
		</View>
	);
}
