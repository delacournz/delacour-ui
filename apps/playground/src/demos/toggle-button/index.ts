import { defineDemoGroup } from "../define-demo-group";
import * as controlled from "./controlled";
import * as filters from "./filters";
import * as formatting from "./formatting";
import * as groupDisabled from "./group-disabled";
import * as orientation from "./orientation";
import * as singleSelection from "./single-selection";
import * as sizes from "./sizes";
import * as states from "./states";
import * as variants from "./variants";

/**
 * Key order is the gallery's reading order — the two axes, the states and the
 * two ways of holding state on one toggle, then the group in both selection
 * modes, its shapes, and a composed row of filters to close.
 */
export const toggleButtonDemos = defineDemoGroup("toggle-button", {
	variants,
	sizes,
	states,
	controlled,
	formatting,
	"single-selection": singleSelection,
	orientation,
	"group-disabled": groupDisabled,
	filters,
});
