import { defineDemoGroup } from "../../define-demo-group";
import * as colours from "./colours";
import * as dashboard from "./dashboard";
import * as empty from "./empty";
import * as flat from "./flat";
import * as gridAndAxes from "./grid-and-axes";
import * as legend from "./legend";
import * as sizes from "./sizes";
import * as tooltip from "./tooltip";

/** The parts around a mark first, then the colours and sizes, then the edges, then a composition. */
export const chartPartsDemos = defineDemoGroup("chart/parts", {
	"grid-and-axes": gridAndAxes,
	tooltip,
	legend,
	colours,
	sizes,
	empty,
	flat,
	dashboard,
});
