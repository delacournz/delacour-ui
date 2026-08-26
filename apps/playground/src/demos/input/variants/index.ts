import { defineDemoGroup } from "../../define-demo-group";
import * as atRest from "./at-rest";
import * as disabled from "./disabled";
import * as focused from "./focused";
import * as invalid from "./invalid";

/** Key order is the gallery's reading order — at rest first, then the states the box can be in. */
export const inputVariantsDemos = defineDemoGroup("input/variants", {
	"at-rest": atRest,
	focused,
	invalid,
	disabled,
});
