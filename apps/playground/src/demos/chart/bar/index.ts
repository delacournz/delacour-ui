import { defineDemoGroup } from "../../define-demo-group";
import * as bar from "./bar";
import * as barGrouped from "./bar-grouped";
import * as barHorizontal from "./bar-horizontal";
import * as barLabels from "./bar-labels";
import * as barNegative from "./bar-negative";
import * as barStacked from "./bar-stacked";
import * as barTooltip from "./bar-tooltip";

/** One bar, then bars beside and on one another, then the orientation, the edge cases and the readout. */
export const chartBarDemos = defineDemoGroup("chart/bar", {
	bar,
	"bar-grouped": barGrouped,
	"bar-stacked": barStacked,
	"bar-horizontal": barHorizontal,
	"bar-negative": barNegative,
	"bar-labels": barLabels,
	"bar-tooltip": barTooltip,
});
