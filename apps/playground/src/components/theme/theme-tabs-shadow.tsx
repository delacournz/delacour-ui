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
 * Its top starts at the bar's own bottom edge. Above that the bar is already
 * opaque, so a fade there would be painting behind something solid; below it is
 * exactly where a row gets cut in half with no chrome to explain the cut, which
 * is what the fade is for.
 */
export function ThemeTabsShadow(): ReactElement {
	return <Screen.ScrollShadow insetTop={useThemeTabBarInset()} />;
}
ThemeTabsShadow.displayName = "Playground.ThemeTabsShadow";
