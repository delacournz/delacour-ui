import { defineDemoGroup } from "../../define-demo-group";
import * as area from "./area";
import * as gradient from "./gradient";
import * as stacked from "./stacked";

/** Key order is the reading order — a flat fill, a gradient, then three fills stacked. */
export const chartsAreaDemos = defineDemoGroup("charts/area", {
	area,
	gradient,
	stacked,
});
