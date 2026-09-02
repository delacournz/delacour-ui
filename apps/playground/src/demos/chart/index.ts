import { defineDemoGroup } from "../define-demo-group";
import * as area from "./area";
import * as colours from "./colours";
import * as curves from "./curves";
import * as dashboard from "./dashboard";
import * as empty from "./empty";
import * as flat from "./flat";
import * as gridAndAxes from "./grid-and-axes";
import * as legend from "./legend";
import * as line from "./line";
import * as multiSeries from "./multi-series";
import * as sizes from "./sizes";
import * as timeSeries from "./time-series";
import * as tooltip from "./tooltip";

/** Key order is the gallery's reading order — one mark, then more, then the parts around them, then the axes and the edges. */
export const chartDemos = defineDemoGroup("chart", {
	line,
	"multi-series": multiSeries,
	area,
	"grid-and-axes": gridAndAxes,
	tooltip,
	legend,
	"time-series": timeSeries,
	colours,
	curves,
	sizes,
	empty,
	flat,
	dashboard,
});
