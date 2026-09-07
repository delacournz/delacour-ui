import { defineDemoGroup } from "../../define-demo-group";
import * as bar from "./bar";
import * as grouped from "./grouped";
import * as horizontal from "./horizontal";
import * as stacked from "./stacked";

/** Key order is the reading order — one series, side by side, stacked, then turned on its side. */
export const chartsBarDemos = defineDemoGroup("charts/bar", {
	bar,
	grouped,
	stacked,
	horizontal,
});
