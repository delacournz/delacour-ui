import { defineDemoGroup } from "../../define-demo-group";
import * as aFormInASheet from "./a-form-in-a-sheet";
import * as keyboardFooterAndInset from "./keyboard-footer-and-inset";

/** Key order is the facet's reading order — the plain form first, the one about the footer's geometry after. */
export const bottomSheetFormDemos = defineDemoGroup("bottom-sheet/form", {
	"a-form-in-a-sheet": aFormInASheet,
	"keyboard-footer-and-inset": keyboardFooterAndInset,
});
