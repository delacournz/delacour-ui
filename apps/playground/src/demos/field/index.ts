import { concatDemoGroups } from "../define-demo-group";
import { fieldAnatomyDemos } from "./anatomy";
import { fieldFormDemos } from "./form";
import { fieldGroupingDemos } from "./grouping";
import { fieldOrientationDemos } from "./orientation";
import { fieldStatesDemos } from "./states";

/** Facet order is the order the folder's index route lists them. */
export const fieldDemos = concatDemoGroups(
	fieldAnatomyDemos,
	fieldOrientationDemos,
	fieldStatesDemos,
	fieldGroupingDemos,
	fieldFormDemos
);
