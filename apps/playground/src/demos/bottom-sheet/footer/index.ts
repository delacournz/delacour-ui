import { defineDemoGroup } from "../../define-demo-group";
import * as inlineInTheFlow from "./inline-in-the-flow";
import * as onAShortSheetStickyStillPins from "./on-a-short-sheet-sticky-still-pins";
import * as stickyPinnedToTheSheet from "./sticky-pinned-to-the-sheet";

/** Key order is the facet's reading order — the default first, then sticky, then the short sheet. */
export const bottomSheetFooterDemos = defineDemoGroup("bottom-sheet/footer", {
	"inline-in-the-flow": inlineInTheFlow,
	"sticky-pinned-to-the-sheet": stickyPinnedToTheSheet,
	"on-a-short-sheet-sticky-still-pins": onAShortSheetStickyStillPins,
});
