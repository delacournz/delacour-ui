import { defineDemoGroup } from "../define-demo-group";
import * as controlled from "./controlled";
import * as iconButtons from "./icon-buttons";
import * as persistent from "./persistent";
import * as placements from "./placements";
import * as press from "./press";
import * as surface from "./surface";

/** Key order is the gallery's reading order — the long press, the tap, where it goes, how it looks, then how long it stays. */
export const tooltipDemos = defineDemoGroup("tooltip", {
	"icon-buttons": iconButtons,
	press,
	placements,
	surface,
	persistent,
	controlled,
});
