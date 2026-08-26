import { defineDemoGroup } from "../define-demo-group";
import * as aNumericSize from "./a-numeric-size";
import * as aSubtreeOfDefaults from "./a-subtree-of-defaults";
import * as colourIsAToken from "./colour-is-a-token";
import * as inheritedFromAButton from "./inherited-from-a-button";
import * as theSizeScale from "./the-size-scale";

/** Key order is the gallery's reading order — the two axes first, then what inherits them. */
export const iconDemos = defineDemoGroup("icon", {
	"the-size-scale": theSizeScale,
	"colour-is-a-token": colourIsAToken,
	"a-numeric-size": aNumericSize,
	"inherited-from-a-button": inheritedFromAButton,
	"a-subtree-of-defaults": aSubtreeOfDefaults,
});
