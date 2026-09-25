import { defineDemoGroup } from "../../define-demo-group";
import * as extendAndRestore from "./extend-and-restore";
import * as fillParent from "./fill-parent";
import * as interactiveWithStickyFooter from "./interactive-with-sticky-footer";
import * as none from "./none";

/** The four `keyboardBehavior`s, the default first; key order is the reading order. */
export const bottomSheetEngineKeyboardDemos = defineDemoGroup("bottom-sheet-engine/keyboard", {
	"interactive-with-sticky-footer": interactiveWithStickyFooter,
	"extend-and-restore": extendAndRestore,
	"fill-parent": fillParent,
	none,
});
