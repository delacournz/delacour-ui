import { defineDemoGroup } from "../define-demo-group";
import * as checkout from "./checkout";
import * as customIndicator from "./custom-indicator";
import * as horizontal from "./horizontal";
import * as linear from "./linear";
import * as readOnly from "./read-only";
import * as sizes from "./sizes";
import * as states from "./states";
import * as variants from "./variants";
import * as vertical from "./vertical";

/** Key order is the gallery's reading order — the two orientations, the axes, the states, the modes, then a whole flow. */
export const stepsDemos = defineDemoGroup("steps", {
	horizontal,
	vertical,
	variants,
	sizes,
	states,
	linear,
	"read-only": readOnly,
	"custom-indicator": customIndicator,
	checkout,
});
