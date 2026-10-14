import { defineDemoGroup } from "../define-demo-group";
import * as mirroredRows from "./mirrored-rows";
import * as nestedOverride from "./nested-override";
import * as toggle from "./toggle";
import * as uniwindVariants from "./uniwind-variants";

/** Key order is the gallery's reading order — the mirror, then nesting, then the runtime flip, then the class variants. */
export const directionDemos = defineDemoGroup("direction", {
	"mirrored-rows": mirroredRows,
	"nested-override": nestedOverride,
	toggle,
	"uniwind-variants": uniwindVariants,
});
