import { defineDemoGroup } from "../define-demo-group";
import * as aGlyphBesideTheTitle from "./a-glyph-beside-the-title";
import * as anyNumberAtOnce from "./any-number-at-once";
import * as disabled from "./disabled";
import * as oneAtATime from "./one-at-a-time";
import * as sizes from "./sizes";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the two axes, then how selection behaves, then the state and the indicator slot. */
export const accordionDemos = defineDemoGroup("accordion", {
	variants,
	sizes,
	"one-at-a-time": oneAtATime,
	"any-number-at-once": anyNumberAtOnce,
	disabled,
	"a-glyph-beside-the-title": aGlyphBesideTheTitle,
});
