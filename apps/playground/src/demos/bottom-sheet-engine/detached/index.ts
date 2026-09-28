import { defineDemoGroup } from "../../define-demo-group";
import * as customMargins from "./custom-margins";
import * as floatingCard from "./floating-card";

/** The card first, the numbers behind it second. */
export const bottomSheetEngineDetachedDemos = defineDemoGroup("bottom-sheet-engine/detached", {
	"floating-card": floatingCard,
	"custom-margins": customMargins,
});
