import { Splitter } from "@delacour/react-native-ui/splitter";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	note: "Two Splitter.Pane children with a Splitter.Handle between them. The handle is a 44pt touch box laid over the seam, so it takes no room from either pane; drag it and both panes follow on the UI thread. Double-tap it to reset.",
};

function PaneLabel({ children }: { children: string }): ReactElement {
	return (
		<View className="flex-1 items-center justify-center p-4">
			<Text.Label className="text-muted-foreground">{children}</Text.Label>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<Splitter className="h-64 rounded-lg border border-border border-continuous bg-card overflow-hidden">
			<Splitter.Pane minSize={20}>
				<PaneLabel>Sidebar</PaneLabel>
			</Splitter.Pane>
			<Splitter.Handle accessibilityLabel="Resize sidebar" testID="handle-0" />
			<Splitter.Pane minSize={20}>
				<PaneLabel>Detail</PaneLabel>
			</Splitter.Pane>
		</Splitter>
	);
}
