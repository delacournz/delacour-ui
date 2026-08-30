import { defineDemoGroup } from "../define-demo-group";
import * as customSuffix from "./custom-suffix";
import * as dividers from "./dividers";
import * as sizes from "./sizes";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the two axes, then the divider rule, then the slots. */
export const listGroupDemos = defineDemoGroup("list-group", {
	variants,
	sizes,
	dividers,
	"custom-suffix": customSuffix,
});
