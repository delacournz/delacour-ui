import { defineDemoGroup } from "../define-demo-group";
import * as alignment from "./alignment";
import * as checkboxGroup from "./checkbox-group";
import * as colours from "./colours";
import * as indeterminate from "./indeterminate";
import * as invalidAndDisabled from "./invalid-and-disabled";
import * as sizes from "./sizes";

/** Key order is the gallery's reading order — the two axes, then the states, then the group. */
export const checkboxDemos = defineDemoGroup("checkbox", {
	colours,
	sizes,
	alignment,
	indeterminate,
	"invalid-and-disabled": invalidAndDisabled,
	"checkbox-group": checkboxGroup,
});
