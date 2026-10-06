import { defineDemoGroup } from "../define-demo-group";
import * as controlled from "./controlled";
import * as controls from "./controls";
import * as coverflow from "./coverflow";
import * as heroTrack from "./hero-track";
import * as loopAutoplay from "./loop-autoplay";
import * as peek from "./peek";
import * as vertical from "./vertical";

/** Key order is the gallery's reading order — the plain track, its layouts, the parts, then motion and state. */
export const carouselDemos = defineDemoGroup("carousel", {
	"hero-track": heroTrack,
	peek,
	coverflow,
	controls,
	vertical,
	"loop-autoplay": loopAutoplay,
	controlled,
});
