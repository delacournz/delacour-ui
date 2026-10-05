import { defineDemoGroup } from "../define-demo-group";
import * as accessibleMove from "./accessible-move";
import * as animatedEdges from "./animated-edges";
import * as connect from "./connect";
import * as controlsMinimap from "./controls-minimap";
import * as drag from "./drag";
import * as edgeVariants from "./edge-variants";
import * as groups from "./groups";
import * as pipeline from "./pipeline";

/** Key order is the gallery's reading order — a whole graph, the routes, groups, the gestures, the chrome, then motion and assistive use. */
export const flowDemos = defineDemoGroup("flow", {
	pipeline,
	"edge-variants": edgeVariants,
	groups,
	drag,
	connect,
	"controls-minimap": controlsMinimap,
	"animated-edges": animatedEdges,
	"accessible-move": accessibleMove,
});
