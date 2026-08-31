import { Screen } from "@delacour/native-ui/screen";
import type { ReactElement } from "react";
import { useThemeTabBarInset } from "@/components/theme/theme-tab-bar";

/**
 * The fade at both ends of whichever tab is showing.
 *
 * A sibling of the navigator rather than something inside each tab, because the
 * two tabs are one scrolling surface as far as the reader is concerned and a
 * fade that changed with the page would draw attention to the seam.
 *
 * The bar's height is `coverTop` rather than an offset, so the band is solid
 * across the bar and only begins dissolving below it. The bar is a pill on a
 * transparent row — content is plainly visible either side of it — so a fade
 * that started under the bar left rows crisp as they slid behind it, then cut
 * them where the fade began.
 */
export function ThemeTabsShadow(): ReactElement {
	return <Screen.ScrollShadow coverTop={useThemeTabBarInset()} />;
}
ThemeTabsShadow.displayName = "Playground.ThemeTabsShadow";
