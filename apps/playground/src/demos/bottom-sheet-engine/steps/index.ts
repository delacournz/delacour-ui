import { defineDemoGroup } from "../../define-demo-group";
import * as perStepSnapPoints from "./per-step-snap-points";
import * as slideTransition from "./slide-transition";
import * as threeStepForm from "./three-step-form";

/** The form first — it is the case the machine exists for; key order is the reading order. */
export const bottomSheetEngineStepsDemos = defineDemoGroup("bottom-sheet-engine/steps", {
	"three-step-form": threeStepForm,
	"per-step-snap-points": perStepSnapPoints,
	"slide-transition": slideTransition,
});
