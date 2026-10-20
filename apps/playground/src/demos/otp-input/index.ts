import { defineDemoGroup } from "../define-demo-group";
import * as alphanumeric from "./alphanumeric";
import * as basic from "./basic";
import * as inField from "./in-field";
import * as pinMasked from "./pin-masked";
import * as sizes from "./sizes";
import * as states from "./states";

/** Key order is the gallery's reading order — the default, the two other patterns, the axes, then a composition. */
export const otpInputDemos = defineDemoGroup("otp-input", {
	basic,
	"pin-masked": pinMasked,
	alphanumeric,
	sizes,
	states,
	"in-field": inField,
});
