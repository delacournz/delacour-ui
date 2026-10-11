import { defineDemoGroup } from "../../define-demo-group";
import * as inlineTwoSnapPoints from "./inline-two-snap-points";
import * as twoSnapPoints from "./two-snap-points";

/** The sheet as it is usually written, teleported, then the same one held inside a box with every ref method beside it. */
export const bottomSheetEngineAnatomyDemos = defineDemoGroup("bottom-sheet-engine/anatomy", {
	"two-snap-points": twoSnapPoints,
	"inline-two-snap-points": inlineTwoSnapPoints,
});
