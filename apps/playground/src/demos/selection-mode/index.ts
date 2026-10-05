import { defineDemoGroup } from "../define-demo-group";
import * as disabledRows from "./disabled-rows";
import * as floatingBar from "./floating-bar";
import * as inASheet from "./in-a-sheet";
import * as inboxMode from "./inbox-mode";
import * as maxLimit from "./max-limit";
import * as sharePicker from "./share-picker";
import * as swatchGrid from "./swatch-grid";
import * as swatchStrip from "./swatch-strip";

/**
 * Key order is the gallery's reading order — the mode on a list first, then the
 * always-on pickers in each layout, the cap, the rows that refuse, the other bar
 * placement, and the sheet composition to close.
 */
export const selectionModeDemos = defineDemoGroup("selection-mode", {
	"inbox-mode": inboxMode,
	"share-picker": sharePicker,
	"swatch-grid": swatchGrid,
	"swatch-strip": swatchStrip,
	"max-limit": maxLimit,
	"disabled-rows": disabledRows,
	"floating-bar": floatingBar,
	"in-a-sheet": inASheet,
});
