import { defineDemoGroup } from "../define-demo-group";
import * as arrow from "./arrow";
import * as basic from "./basic";
import * as edgeCollision from "./edge-collision";
import * as placements from "./placements";
import * as scrim from "./scrim";
import * as scrollable from "./scrollable";
import * as triggerWidthForm from "./trigger-width-form";
import * as unstyled from "./unstyled";

/** Key order is the gallery's reading order — the panel, where it goes, what it holds, then how it looks. */
export const popoverDemos = defineDemoGroup("popover", {
	basic,
	placements,
	arrow,
	"trigger-width-form": triggerWidthForm,
	scrollable,
	"edge-collision": edgeCollision,
	unstyled,
	scrim,
});
