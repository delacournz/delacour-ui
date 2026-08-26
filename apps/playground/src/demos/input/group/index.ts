import { defineDemoGroup } from "../../define-demo-group";
import * as controls from "./controls";
import * as icons from "./icons";
import * as multiline from "./multiline";
import * as sideBySide from "./side-by-side";
import * as sizesAndStates from "./sizes-and-states";
import * as textAffixes from "./text-affixes";

/** Key order is the gallery's reading order — the acceptance test first, the edge cases last. */
export const inputGroupDemos = defineDemoGroup("input/group", {
	"side-by-side": sideBySide,
	icons,
	"text-affixes": textAffixes,
	controls,
	"sizes-and-states": sizesAndStates,
	multiline,
});
