import { defineDemoGroup } from "../../define-demo-group";
import * as aboveTheNavigator from "./above-the-navigator";
import * as insideANativeModal from "./inside-a-native-modal";
import * as twoSheetsStacked from "./two-sheets-stacked";

/** The default first: a sheet that teleports. Then the stack, then the one place the root host cannot reach. */
export const bottomSheetEnginePortalDemos = defineDemoGroup("bottom-sheet-engine/portal", {
	"above-the-navigator": aboveTheNavigator,
	"two-sheets-stacked": twoSheetsStacked,
	"inside-a-native-modal": insideANativeModal,
});
