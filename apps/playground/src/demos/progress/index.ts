import { defineDemoGroup } from "../define-demo-group";
import * as anatomy from "./anatomy";
import * as colours from "./colours";
import * as controlled from "./controlled";
import * as formatting from "./formatting";
import * as indeterminate from "./indeterminate";
import * as sizes from "./sizes";
import * as upload from "./upload";

/** Key order is the gallery's reading order — the parts, a moving value, the axes, the loop, the formats, then a composition. */
export const progressDemos = defineDemoGroup("progress", {
	anatomy,
	controlled,
	colours,
	sizes,
	indeterminate,
	formatting,
	upload,
});
