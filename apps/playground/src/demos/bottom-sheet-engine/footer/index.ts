import { defineDemoGroup } from "../../define-demo-group";
import * as stickyOnAShortSheet from "./sticky-on-a-short-sheet";

/** The sticky footer without a keyboard; the keyboard facet shows it riding one. */
export const bottomSheetEngineFooterDemos = defineDemoGroup("bottom-sheet-engine/footer", {
	"sticky-on-a-short-sheet": stickyOnAShortSheet,
});
