import { defineDemoGroup } from "../define-demo-group";
import * as handle from "./handle";
import * as inScrollView from "./in-scroll-view";
import * as listGroup from "./list-group";
import * as longPress from "./long-press";
import * as pinned from "./pinned";
import * as variableHeights from "./variable-heights";

/** Key order is the gallery's reading order — the two activations, the geometry, then the containers it sits in. */
export const sortableDemos = defineDemoGroup("sortable", {
	handle,
	"long-press": longPress,
	"variable-heights": variableHeights,
	pinned,
	"list-group": listGroup,
	"in-scroll-view": inScrollView,
});
