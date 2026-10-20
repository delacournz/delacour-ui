import { SplitView } from "@delacour/react-native-ui/split-view";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	align: "stretch",
	note: "isDisabled freezes the divider: no drag, no tap, no assistive actions, and the grip dims.",
};

export function Demo(): ReactElement {
	return (
		<SplitView className="h-64" isDisabled>
			<SplitView.Top testID="pane-top" />
			<SplitView.DragArea testID="drag-area" />
			<SplitView.Bottom testID="pane-bottom" />
		</SplitView>
	);
}
