import { footerOccupancy, Screen } from "@delacour/native-ui/screen";
import type { ReactElement } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
 * **`coverBottom` is what makes it reach the footer.** The fade anchors itself
 * above the footer's measured CONTENT height, but the footer occupies its own
 * padding and the safe-area band as well — on a device with a home indicator
 * that is thirty-four points where rows stay crisp behind the button and then
 * cut, which is the exact artefact `coverBottom` exists to prevent. Painting
 * that band solid puts the content out before it reaches the button, with the
 * gradient below doing the dissolving. The mirror of what the tab bar does at
 * the other end with `coverTop`.
 *
 * `footerOccupancy(0, bottom)` is the library's own arithmetic rather than a
 * restatement of `SCREEN_FOOTER_PADDING + SCREEN_FLOATING_BOTTOM_GAP + bottom`,
 * so the two cannot drift if those constants move. Zero content, because the
 * fade already offsets itself by the measured height.
 *
 * That does couple this to `ThemeFooter`: remove the footer and this paints a
 * solid band across the bottom of both tabs.
 */
export function ThemeTabsShadow(): ReactElement {
	const { bottom } = useSafeAreaInsets();

	return <Screen.ScrollShadow coverBottom={footerOccupancy(0, bottom)} edges="bottom" />;
}
ThemeTabsShadow.displayName = "Playground.ThemeTabsShadow";
