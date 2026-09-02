import { defineDemoGroup } from "../../define-demo-group";
import * as area from "./area";
import * as areaStacked from "./area-stacked";

/** One fill, then three fills standing on one another. */
export const chartAreaDemos = defineDemoGroup("chart/area", {
	area,
	"area-stacked": areaStacked,
});
