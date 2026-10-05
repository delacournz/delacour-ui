import { defineDemoGroup } from "../define-demo-group";
import * as customIcon from "./custom-icon";
import * as inlineText from "./inline-text";
import * as reducedMotion from "./reduced-motion";
import * as sizes from "./sizes";
import * as statusFlow from "./status-flow";
import * as statuses from "./statuses";

/** Key order is the gallery's reading order — the roll, the statuses and sizes, the glyph, then the edge cases. */
export const animatedBadgeDemos = defineDemoGroup("animated-badge", {
	"status-flow": statusFlow,
	statuses,
	sizes,
	"custom-icon": customIcon,
	"inline-text": inlineText,
	"reduced-motion": reducedMotion,
});
