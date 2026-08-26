import { defineDemoGroup } from "../define-demo-group";
import * as alignment from "./alignment";
import * as bareBoxesAndTheirTargets from "./bare-boxes-and-their-targets";
import * as checkboxGroup from "./checkbox-group";
import * as colours from "./colours";
import * as groupAxesAreDefaults from "./group-axes-are-defaults";
import * as indeterminate from "./indeterminate";
import * as insideAField from "./inside-a-field";
import * as invalidAndDisabled from "./invalid-and-disabled";
import * as longLabelInANarrowColumn from "./long-label-in-a-narrow-column";
import * as pressFeedback from "./press-feedback";
import * as sizes from "./sizes";

/** Key order is the gallery's reading order — the axes first, the edge cases last. */
export const checkboxDemos = defineDemoGroup("checkbox", {
	colours,
	sizes,
	alignment,
	indeterminate,
	"checkbox-group": checkboxGroup,
	"group-axes-are-defaults": groupAxesAreDefaults,
	"invalid-and-disabled": invalidAndDisabled,
	"inside-a-field": insideAField,
	"press-feedback": pressFeedback,
	"bare-boxes-and-their-targets": bareBoxesAndTheirTargets,
	"long-label-in-a-narrow-column": longLabelInANarrowColumn,
});
