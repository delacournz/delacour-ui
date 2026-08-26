import { defineDemoGroup } from "../../define-demo-group";
import * as aScrollingSheet from "./a-scrolling-sheet";
import * as scrollingUnderAPinnedFooter from "./scrolling-under-a-pinned-footer";

/** Key order is the facet's reading order — the plain scrollable first, then the one with a footer. */
export const bottomSheetScrollingDemos = defineDemoGroup("bottom-sheet/scrolling", {
	"a-scrolling-sheet": aScrollingSheet,
	"scrolling-under-a-pinned-footer": scrollingUnderAPinnedFooter,
});
