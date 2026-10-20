import { defineDemoGroup } from "../define-demo-group";
import * as badges from "./badges";
import * as cards from "./cards";
import * as holdToPause from "./hold-to-pause";
import * as speed from "./speed";
import * as twoRows from "./two-rows";
import * as vertical from "./vertical";

/** Key order is the gallery's reading order — the strip, rows in step, the other axis, the hold, the speed, then tappable content. */
export const marqueeDemos = defineDemoGroup("marquee", {
	badges,
	"two-rows": twoRows,
	vertical,
	"hold-to-pause": holdToPause,
	speed,
	cards,
});
