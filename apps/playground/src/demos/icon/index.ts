import { defineDemoGroup } from "../define-demo-group";
import * as colourIsAToken from "./colour-is-a-token";
import * as inheritedFromAButton from "./inherited-from-a-button";
import * as theSizeScale from "./the-size-scale";

/** Key order is the gallery's reading order — the scale, the colour token, then what it inherits. */
export const iconDemos = defineDemoGroup("icon", {
	"the-size-scale": theSizeScale,
	"colour-is-a-token": colourIsAToken,
	"inherited-from-a-button": inheritedFromAButton,
});
