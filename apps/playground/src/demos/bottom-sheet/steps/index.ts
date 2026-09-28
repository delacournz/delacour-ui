import { defineDemoGroup } from "../../define-demo-group";
import * as perStepSnapPoints from "./per-step-snap-points";
import * as threeStepForm from "./three-step-form";

/** Key order is the facet's reading order — the form first, the sizing rule it relies on after. */
export const bottomSheetStepsDemos = defineDemoGroup("bottom-sheet/steps", {
	"three-step-form": threeStepForm,
	"per-step-snap-points": perStepSnapPoints,
});
