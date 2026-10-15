import { defineDemoGroup } from "../define-demo-group";
import * as accessibleNames from "./accessible-names";
import * as anatomy from "./anatomy";
import * as controlled from "./controlled";
import * as disabled from "./disabled";
import * as scrollingPanes from "./scrolling-panes";
import * as seam from "./seam";
import * as snapPoints from "./snap-points";

/** Key order is the gallery's reading order — the parts, the variant, the units, then control, scrolling and states. */
export const splitViewDemos = defineDemoGroup("split-view", {
	anatomy,
	seam,
	"snap-points": snapPoints,
	controlled,
	"scrolling-panes": scrollingPanes,
	"accessible-names": accessibleNames,
	disabled,
});
