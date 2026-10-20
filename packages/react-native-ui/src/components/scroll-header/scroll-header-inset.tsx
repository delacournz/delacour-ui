import type { ReactElement } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useScrollHeaderPart } from "./scroll-header.context";

/**
 * The spacer at the top of the scroller's content — the safe-area band, the bar and the Large
 * block — so the first row rests exactly under the Large block.
 *
 * A view whose height is an animated style, not padding on the content container: padding
 * cannot animate on the UI thread, and the bar and Large block measure after the first frame.
 * `ScrollHeader.ScrollView` and `.FlatList` mount it for you; render it yourself at the top of
 * any other scroller wired through `useScrollHeader()`.
 */
export function ScrollHeaderInset(): ReactElement {
	const { topInset } = useScrollHeaderPart("ScrollHeader.Inset");
	const heightStyle = useAnimatedStyle(() => ({ height: topInset.value }));

	return <Animated.View accessible={false} pointerEvents="none" style={heightStyle} />;
}
ScrollHeaderInset.displayName = "DelacourUI.ScrollHeader.Inset";
