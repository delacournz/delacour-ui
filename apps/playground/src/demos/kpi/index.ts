import { defineDemoGroup } from "../define-demo-group";
import * as anatomy from "./anatomy";
import * as colours from "./colours";
import * as configurator from "./configurator";
import * as dashboard from "./dashboard";
import * as goodDirection from "./good-direction";
import * as group from "./group";
import * as inline from "./inline";
import * as loading from "./loading";
import * as scrub from "./scrub";
import * as scrubControlled from "./scrub-controlled";
import * as sizes from "./sizes";
import * as trendVariants from "./trend-variants";

/** Key order is the gallery's reading order — the anatomy, what a change means, the axes, the scrub, then KPIs in use. */
export const kpiDemos = defineDemoGroup("kpi", {
	anatomy,
	"good-direction": goodDirection,
	"trend-variants": trendVariants,
	sizes,
	inline,
	colours,
	configurator,
	scrub,
	"scrub-controlled": scrubControlled,
	loading,
	group,
	dashboard,
});
