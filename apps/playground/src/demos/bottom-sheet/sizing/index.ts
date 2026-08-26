import { defineDemoGroup } from "../../define-demo-group";
import * as dynamicButCapped from "./dynamic-but-capped";
import * as explicitSnapPoints from "./explicit-snap-points";
import * as sizedToItsContent from "./sized-to-its-content";
import * as theSameSheetMoreContent from "./the-same-sheet-more-content";

/** Key order is the facet's reading order — the measurement first, the numbers after. */
export const bottomSheetSizingDemos = defineDemoGroup("bottom-sheet/sizing", {
	"sized-to-its-content": sizedToItsContent,
	"the-same-sheet-more-content": theSameSheetMoreContent,
	"explicit-snap-points": explicitSnapPoints,
	"dynamic-but-capped": dynamicButCapped,
});
