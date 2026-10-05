import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as cards from "./cards";
import * as controlled from "./controlled";
import * as customLabelsModes from "./custom-labels-modes";
import * as inField from "./in-field";
import * as persisted from "./persisted";
import * as sizes from "./sizes";

/**
 * Key order is the gallery's reading order — the control on the live theme and held
 * in your own state, its
 * two looks and three sizes, then the options trimmed and renamed, the
 * persistence recipe, and the selector in a settings field to close.
 */
export const themeSelectorDemos = defineDemoGroup("theme-selector", {
	basic,
	controlled,
	cards,
	sizes,
	"custom-labels-modes": customLabelsModes,
	persisted,
	"in-field": inField,
});
