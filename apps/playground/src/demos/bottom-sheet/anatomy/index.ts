import { defineDemoGroup } from "../../define-demo-group";
import * as aScrimThatDoesNotDismiss from "./a-scrim-that-does-not-dismiss";
import * as theWholeComposition from "./the-whole-composition";
import * as uncontrolled from "./uncontrolled";

/** Key order is the facet's reading order — the whole composition first, the edge cases after. */
export const bottomSheetAnatomyDemos = defineDemoGroup("bottom-sheet/anatomy", {
	"the-whole-composition": theWholeComposition,
	"a-scrim-that-does-not-dismiss": aScrimThatDoesNotDismiss,
	uncontrolled,
});
