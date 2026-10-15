import { defineDemoGroup } from "../define-demo-group";
import * as arcs from "./arcs";
import * as controls from "./controls";
import * as flyTo from "./fly-to";
import * as places from "./places";
import * as popup from "./popup";
import * as route from "./route";
import * as tones from "./tones";

/** Key order is the gallery's reading order — places, then lines, then a popup, then moving the camera. */
export const mapDemos = defineDemoGroup("map", {
	places,
	route,
	arcs,
	popup,
	tones,
	controls,
	"fly-to": flyTo,
});
