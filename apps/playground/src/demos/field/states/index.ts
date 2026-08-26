import { defineDemoGroup } from "../../define-demo-group";
import * as aControlCanOptOut from "./a-control-can-opt-out";
import * as disabled from "./disabled";
import * as live from "./live";
import * as oneFlagThreeThings from "./one-flag-three-things";
import * as throughAnInputGroup from "./through-an-input-group";

/** Key order is the gallery's reading order — the cascade first, then what overrides it and what else it carries. */
export const fieldStatesDemos = defineDemoGroup("field/states", {
	"one-flag-three-things": oneFlagThreeThings,
	"a-control-can-opt-out": aControlCanOptOut,
	"through-an-input-group": throughAnInputGroup,
	live,
	disabled,
});
