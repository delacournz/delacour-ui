import { defineDemoGroup } from "../define-demo-group";
import * as autoReset from "./auto-reset";
import * as controlled from "./controlled";
import * as customDone from "./custom-done";
import * as disabled from "./disabled";
import * as holdToErase from "./hold-to-erase";
import * as shapeRounded from "./shape-rounded";
import * as sizes from "./sizes";
import * as variants from "./variants";

/**
 * Key order is the gallery's reading order — the hold itself, then the two
 * axes and the shape, then what happens after a hold: controlled, auto reset, a
 * custom done mark, and the disabled state to close.
 */
export const progressButtonDemos = defineDemoGroup("progress-button", {
	"hold-to-erase": holdToErase,
	variants,
	sizes,
	"shape-rounded": shapeRounded,
	controlled,
	"auto-reset": autoReset,
	"custom-done": customDone,
	disabled,
});
