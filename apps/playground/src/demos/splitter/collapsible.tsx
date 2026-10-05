import { Button } from "@delacour/react-native-ui/button";
import { Splitter, useSplitter } from "@delacour/react-native-ui/splitter";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Collapsible",
	align: "stretch",
	note: "isCollapsible lets a pane fold away: drag it past half its minSize and it snaps to collapsedSize; drag back over that line and it reopens at its floor. useSplitter() hands a custom child togglePane, so a button can do the same.",
};

function ToggleSidebar(): ReactElement {
	const { layout, togglePane } = useSplitter();
	const isCollapsed = (layout[0] ?? 0) === 0;
	return (
		<Button onPress={() => togglePane(0)} size="sm" testID="toggle-sidebar" variant="secondary">
			<Button.Label>{isCollapsed ? "Show sidebar" : "Hide sidebar"}</Button.Label>
		</Button>
	);
}

export function Demo(): ReactElement {
	return (
		<Splitter
			className="h-64 rounded-lg border border-border border-continuous bg-card overflow-hidden"
			defaultLayout={[35, 65]}
		>
			<Splitter.Pane defaultSize={35} isCollapsible maxSize={50} minSize={25}>
				<View className="flex-1 items-center justify-center p-4">
					<Text.Label className="text-muted-foreground" numberOfLines={1}>
						Sidebar
					</Text.Label>
				</View>
			</Splitter.Pane>
			<Splitter.Handle accessibilityLabel="Resize sidebar" testID="handle-0" />
			<Splitter.Pane minSize={40}>
				<View className="flex-1 items-center justify-center gap-3 p-4">
					<Text.Label>Detail</Text.Label>
					<ToggleSidebar />
				</View>
			</Splitter.Pane>
		</Splitter>
	);
}
