import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as bounds from "./bounds";
import * as currency from "./currency";
import * as customAnatomy from "./custom-anatomy";
import * as decimalStep from "./decimal-step";
import * as holdToRepeat from "./hold-to-repeat";
import * as inField from "./in-field";
import * as sizesVariants from "./sizes-variants";

/** Key order is the gallery's reading order — the control, its range and grid, its look, then composition. */
export const numberInputDemos = defineDemoGroup("number-input", {
	basic,
	bounds,
	"decimal-step": decimalStep,
	currency,
	"hold-to-repeat": holdToRepeat,
	"sizes-variants": sizesVariants,
	"in-field": inField,
	"custom-anatomy": customAnatomy,
});
