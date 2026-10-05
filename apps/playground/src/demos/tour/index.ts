import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as circleShape from "./circle-shape";
import * as customLabels from "./custom-labels";
import * as interactive from "./interactive";
import * as placement from "./placement";
import * as scrollIntoView from "./scroll-into-view";

/** Key order is the gallery's reading order — the default tour, the hole's shape, the card's side, then the modes. */
export const tourDemos = defineDemoGroup("tour", {
	basic,
	"circle-shape": circleShape,
	placement,
	interactive,
	"scroll-into-view": scrollIntoView,
	"custom-labels": customLabels,
});
