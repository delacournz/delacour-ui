import { defineDemoGroup } from "../../define-demo-group";
import * as donut from "./donut";
import * as pie from "./pie";
import * as pieLabels from "./pie-labels";
import * as pieTap from "./pie-tap";

/** A pie, then the hole, then the labels on the slices, then the tap. */
export const chartPieDemos = defineDemoGroup("chart/pie", {
	pie,
	donut,
	"pie-labels": pieLabels,
	"pie-tap": pieTap,
});
