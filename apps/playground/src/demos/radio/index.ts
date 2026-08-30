import { defineDemoGroup } from "../define-demo-group";
import * as customIndicator from "./custom-indicator";
import * as horizontalWrapping from "./horizontal-wrapping";
import * as perOptionDescription from "./per-option-description";
import * as sizes from "./sizes";
import * as variantsAndStates from "./variants-and-states";

/** Key order is the gallery's reading order — the matrix, then size, then orientation, then the slots. */
export const radioDemos = defineDemoGroup("radio", {
	"variants-and-states": variantsAndStates,
	sizes,
	"horizontal-wrapping": horizontalWrapping,
	"per-option-description": perOptionDescription,
	"custom-indicator": customIndicator,
});
