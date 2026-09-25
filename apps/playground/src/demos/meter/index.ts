import { defineDemoGroup } from "../define-demo-group";
import * as anatomy from "./anatomy";
import * as colours from "./colours";
import * as formatting from "./formatting";
import * as planUsage from "./plan-usage";
import * as regions from "./regions";
import * as segments from "./segments";
import * as sizes from "./sizes";
import * as thresholds from "./thresholds";

/** Key order is the gallery's reading order — the parts, the two ways to judge a reading, blocks, the axes, the formats, then a composition. */
export const meterDemos = defineDemoGroup("meter", {
	anatomy,
	regions,
	thresholds,
	segments,
	colours,
	sizes,
	formatting,
	"plan-usage": planUsage,
});
