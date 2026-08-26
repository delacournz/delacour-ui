import { defineDemoGroup } from "../../define-demo-group";
import * as aFormInASheet from "./a-form-in-a-sheet";

/** One demo: the facet's second section was prose only, and now rides on this demo's note. */
export const bottomSheetFormDemos = defineDemoGroup("bottom-sheet/form", {
	"a-form-in-a-sheet": aFormInASheet,
});
