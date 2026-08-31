import { Screen } from "@delacour/native-ui/screen";
import type { ReactElement } from "react";

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
 */
export function ThemeTabsShadow(): ReactElement {
	return <Screen.ScrollShadow edges="bottom" />;
}
ThemeTabsShadow.displayName = "Playground.ThemeTabsShadow";
