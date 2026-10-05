import { defineDemoGroup } from "../define-demo-group";
import * as arc from "./arc";
import * as badge from "./badge";
import * as controlled from "./controlled";
import * as holdToPause from "./hold-to-pause";
import * as loadingRing from "./loading-ring";
import * as seal from "./seal";
import * as twoRings from "./two-rings";

/** Key order is the gallery's reading order — the seal, the compositions, then pause and a caller-driven angle. */
export const circularTextDemos = defineDemoGroup("circular-text", {
	seal,
	"two-rings": twoRings,
	arc,
	badge,
	"loading-ring": loadingRing,
	"hold-to-pause": holdToPause,
	controlled,
});
