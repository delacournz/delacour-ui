import { defineDemoGroup } from "../../define-demo-group";
import * as donut from "./donut";
import * as pie from "./pie";

/** Key order is the reading order — a pie, then a donut that takes a tap. */
export const chartsPieDemos = defineDemoGroup("charts/pie", {
	pie,
	donut,
});
