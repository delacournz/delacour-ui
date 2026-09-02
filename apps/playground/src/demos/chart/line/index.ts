import { defineDemoGroup } from "../../define-demo-group";
import * as curves from "./curves";
import * as line from "./line";
import * as multiSeries from "./multi-series";
import * as timeSeries from "./time-series";

/** Key order is the reading order — one line, then more, then a time axis, then how the line bends. */
export const chartLineDemos = defineDemoGroup("chart/line", {
	line,
	"multi-series": multiSeries,
	"time-series": timeSeries,
	curves,
});
