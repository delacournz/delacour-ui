import { footerOccupancy, Screen, useScreen } from "delacour-react-native-ui/screen";
import { type ReactElement, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedReaction, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

/**
 * The fade at the end of whichever tab is showing.
 *
 * A sibling of the navigator rather than something inside each tab, because the
 * two tabs are one scrolling surface as far as the reader is concerned and a
 * fade that changed with the page would draw attention to the seam.
 *
 * Only the bottom. The top fade belongs to the tab bar and is drawn there,
 * because a sibling of the navigator paints over everything the navigator drew —
 * the bar included — and the fade has to sit under it.
 *
 * **The fade is shifted down by the footer's content height, and covers the
 * whole footer.** `Screen.ScrollShadow` anchors its bottom band at the footer's
 * measured *content* height and extends `coverBottom` upward from there — so
 * out of the box the solid part sat above the button and the band beneath it,
 * the button's own height plus its padding and the safe-area strip, was never
 * painted: rows ran crisp under the lower half of `Generate CSS` and through
 * the home indicator, which the finish review caught in a capture. The fix is
 * arithmetic, not a second fade: an animated wrapper moves the whole shadow
 * down by the content height it anchored on, so its band starts at the screen
 * edge, and `coverBottom` is the footer's full occupancy — content, padding and
 * inset — so the solid part reaches the footer's top edge and the gradient
 * dissolves the rows above it. `footerOccupancy` is the library's own sum, so
 * it cannot drift from the reserve the scroll areas already clear.
 *
 * The content height reaches React through `useAnimatedReaction`, because
 * `coverBottom` is a prop and a prop is a number, not a shared value. It settles
 * after the first layout and moves only when the Style axis resizes the button.
 *
 * That does couple this to `ThemeFooter`: remove the footer and this paints a
 * solid band across the bottom of both tabs.
 */
export function ThemeTabsShadow(): ReactElement {
	const { bottom } = useSafeAreaInsets();
	const { footer } = useScreen();
	const [contentHeight, setContentHeight] = useState(0);

	useAnimatedReaction(
		() => footer.height.value,
		(height, previous) => {
			if (height !== previous) scheduleOnRN(setContentHeight, height);
		},
		[footer]
	);

	const shift = useAnimatedStyle(() => ({ bottom: -footer.height.value }));

	return (
		<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, shift]}>
			<Screen.ScrollShadow coverBottom={footerOccupancy(contentHeight, bottom)} edges="bottom" />
		</Animated.View>
	);
}
ThemeTabsShadow.displayName = "Playground.ThemeTabsShadow";
