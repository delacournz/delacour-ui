import { defineDemoGroup } from "../define-demo-group";
import * as controlledDial from "./controlled-dial";
import * as extended from "./extended";
import * as overAList from "./over-a-list";
import * as placements from "./placements";
import * as sizesAndVariants from "./sizes-and-variants";
import * as speedDial from "./speed-dial";

/**
 * Key order is the gallery's reading order — the fab where it lives, over a
 * list, then its extended form, the dial, the two axes in flow, the three
 * pinned placements, and the dial with its state held outside.
 */
export const fabDemos = defineDemoGroup("fab", {
	"over-a-list": overAList,
	extended,
	"speed-dial": speedDial,
	"sizes-and-variants": sizesAndVariants,
	placements,
	"controlled-dial": controlledDial,
});
