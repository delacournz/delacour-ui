import { defineDemoGroup } from "../define-demo-group";
import * as parallax from "./parallax";
import * as reducedMotion from "./reduced-motion";
import * as reveal from "./reveal";
import * as sequence from "./sequence";
import * as windowAndDistance from "./window-and-distance";
import * as zoom from "./zoom";

/** Key order is the gallery's reading order — the four effects, then tuning, then the still states. */
export const scrollCanvasDemos = defineDemoGroup("scroll-canvas", {
	parallax,
	zoom,
	reveal,
	sequence,
	"window-and-distance": windowAndDistance,
	"reduced-motion": reducedMotion,
});
