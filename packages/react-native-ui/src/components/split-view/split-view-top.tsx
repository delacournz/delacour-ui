import type { ReactElement } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSplitViewPart } from "./split-view.context";
import type { SplitViewPaneProps } from "./split-view.types";
import { splitViewVariants } from "./split-view.variants";

/**
 * The upper pane, whose height is the split view's one moving number.
 *
 * Its height is an animated style off the root's shared value, so a drag
 * resizes it on the UI thread and the bottom pane's `flex-1` follows in the
 * same layout pass. Until the root has been measured it flexes like the bottom
 * pane instead, so the first frame is an even split rather than a garbage
 * height.
 */
export function SplitViewTop({ className, children, ...props }: SplitViewPaneProps): ReactElement {
	const { variant, top, extent } = useSplitViewPart("SplitView.Top");
	const style = useAnimatedStyle(() =>
		extent.value > 0 ? { flexGrow: 0, flexShrink: 0, height: top.value } : { flexGrow: 1, flexShrink: 1 }
	);

	return (
		<Animated.View className={splitViewVariants({ variant }).top({ className })} style={style} {...props}>
			{children}
		</Animated.View>
	);
}
SplitViewTop.displayName = "DelacourUI.SplitView.Top";
