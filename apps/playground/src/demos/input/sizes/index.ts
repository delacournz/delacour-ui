import { defineDemoGroup } from "../../define-demo-group";
import * as besideAButton from "./beside-a-button";
import * as multiline from "./multiline";
import * as sizes from "./sizes";

/** Key order is the gallery's reading order — the scale first, then the two things it drives beyond the box. */
export const inputSizesDemos = defineDemoGroup("input/sizes", {
	sizes,
	"beside-a-button": besideAButton,
	multiline,
});
