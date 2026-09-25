import { defineDemoGroup } from "../../define-demo-group";
import * as inlineTwoDetents from "./inline-two-detents";

/** One demo until BSHEET-8 fills the facet; key order is the reading order. */
export const bottomSheetEngineAnatomyDemos = defineDemoGroup("bottom-sheet-engine/anatomy", {
	"inline-two-detents": inlineTwoDetents,
});
