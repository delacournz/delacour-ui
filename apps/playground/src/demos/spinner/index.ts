import { defineDemoGroup } from "../define-demo-group";
import * as colours from "./colours";
import * as customGlyph from "./custom-glyph";
import * as sizes from "./sizes";

/** Key order is the gallery's reading order — the scale, the colours, then the glyph slot. */
export const spinnerDemos = defineDemoGroup("spinner", {
	sizes,
	colours,
	"custom-glyph": customGlyph,
});
