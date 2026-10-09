import { defineDemoGroup } from "../define-demo-group";
import * as autoReset from "./auto-reset";
import * as controlledAsync from "./controlled-async";
import * as customThumb from "./custom-thumb";
import * as disabled from "./disabled";
import * as sizes from "./sizes";
import * as slideToShip from "./slide-to-ship";
import * as threshold from "./threshold";
import * as variants from "./variants";

/**
 * Key order is the gallery's reading order — the gesture itself, the two axes,
 * the threshold, then the ways of holding state and the handle and state
 * variations to close.
 */
export const slideButtonDemos = defineDemoGroup("slide-button", {
	"slide-to-ship": slideToShip,
	variants,
	sizes,
	threshold,
	"controlled-async": controlledAsync,
	"auto-reset": autoReset,
	"custom-thumb": customThumb,
	disabled,
});
