import { defineDemoGroup } from "../define-demo-group";
import * as accessibleNames from "./accessible-names";
import * as anatomy from "./anatomy";
import * as coloursAndSizes from "./colours-and-sizes";
import * as controlled from "./controlled";
import * as disabled from "./disabled";
import * as grabAnywhere from "./grab-anywhere";
import * as snapPoints from "./snap-points";
import * as themes from "./themes";
import * as vertical from "./vertical";

/** Key order is the gallery's reading order — the parts, the realistic use, the axes, then behaviour and states. */
export const compareDemos = defineDemoGroup("compare", {
	anatomy,
	themes,
	vertical,
	"snap-points": snapPoints,
	"colours-and-sizes": coloursAndSizes,
	controlled,
	"grab-anywhere": grabAnywhere,
	"accessible-names": accessibleNames,
	disabled,
});
