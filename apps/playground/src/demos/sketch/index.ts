import { defineDemoGroup } from "../define-demo-group";
import * as annotate from "./annotate";
import * as colours from "./colours";
import * as defaultDemo from "./default";
import * as draw from "./draw";
import * as eraser from "./eraser";
import * as shapes from "./shapes";

/** Key order is the gallery's reading order — the whole thing, then each tool, colour, and a composition. */
export const sketchDemos = defineDemoGroup("sketch", {
	default: defaultDemo,
	draw,
	shapes,
	eraser,
	colours,
	annotate,
});
