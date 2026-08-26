import { defineDemoGroup } from "../../define-demo-group";
import * as aNestedSet from "./a-nested-set";
import * as group from "./group";
import * as separator from "./separator";
import * as separatorOnACard from "./separator-on-a-card";
import * as setAndLegend from "./set-and-legend";

/** Key order is the gallery's reading order — the three levels above a field first, the rule between them last. */
export const fieldGroupingDemos = defineDemoGroup("field/grouping", {
	group,
	"set-and-legend": setAndLegend,
	"a-nested-set": aNestedSet,
	separator,
	"separator-on-a-card": separatorOnACard,
});
