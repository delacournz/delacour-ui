import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as besideASwitch from "./beside-a-switch";
import * as requiredMark from "./required-mark";
import * as signUp from "./sign-up";
import * as sizes from "./sizes";
import * as states from "./states";
import * as toggleStates from "./toggle-states";
import * as wrapping from "./wrapping";

/** Key order is the gallery's reading order — the label, its states, its scale, then it at work. */
export const labelDemos = defineDemoGroup("label", {
	basic,
	states,
	"toggle-states": toggleStates,
	sizes,
	wrapping,
	"required-mark": requiredMark,
	"beside-a-switch": besideASwitch,
	"sign-up": signUp,
});
