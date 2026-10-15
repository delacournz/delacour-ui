import { SplitView } from "@delacour/react-native-ui/split-view";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Accessible names",
	align: "stretch",
	note: 'The drag row is adjustable. A screen reader reads its label and position — "Resize preview, Position 2 of 3" — swipes up and down step a stop, and a double tap cycles and announces where it landed. Name the pane being resized; the default is "Resize panes".',
};

export function Demo(): ReactElement {
	return (
		<SplitView className="h-80">
			<SplitView.Top testID="pane-top" />
			<SplitView.DragArea accessibilityLabel="Resize preview" testID="drag-area" />
			<SplitView.Bottom testID="pane-bottom" />
		</SplitView>
	);
}
