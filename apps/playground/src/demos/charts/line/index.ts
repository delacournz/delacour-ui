import { defineDemoGroup } from "../../define-demo-group";
import * as curves from "./curves";
import * as line from "./line";
import * as timeSeries from "./time-series";

/** Key order is the reading order — one line, then a time axis, then how the line bends. */
export const chartsLineDemos = defineDemoGroup("charts/line", {
	line,
	"time-series": timeSeries,
	curves,
});
