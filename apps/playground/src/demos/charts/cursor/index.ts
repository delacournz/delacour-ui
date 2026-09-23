import { defineDemoGroup } from "../../define-demo-group";
import * as readout from "./readout";
import * as scrub from "./scrub";
import * as stacked from "./stacked";

/** Key order is the reading order — the cursor marks, a view reading the same values, then a stack. */
export const chartsCursorDemos = defineDemoGroup("charts/cursor", {
	scrub,
	readout,
	stacked,
});
