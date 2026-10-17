import type { ReactElement } from "react";
import { View } from "react-native";
import { useSplitViewPart } from "./split-view.context";
import type { SplitViewPaneProps } from "./split-view.types";
import { splitViewVariants } from "./split-view.variants";

/**
 * The lower pane. `flex-1`, so it is always the box less the top pane and the
 * drag row — it never holds a height of its own and can never disagree with
 * the top. A scrollable inside it is the caller's; the gesture lives only on
 * the drag row, so scrolling here never moves the divider.
 */
export function SplitViewBottom({ className, children, ...props }: SplitViewPaneProps): ReactElement {
	const { variant } = useSplitViewPart("SplitView.Bottom");
	return (
		<View className={splitViewVariants({ variant }).bottom({ className })} {...props}>
			{children}
		</View>
	);
}
SplitViewBottom.displayName = "DelacourUI.SplitView.Bottom";
