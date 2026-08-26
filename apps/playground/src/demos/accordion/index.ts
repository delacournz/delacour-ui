import { defineDemoGroup } from "../define-demo-group";
import * as aCustomIndicator from "./a-custom-indicator";
import * as aGlyphBesideTheTitle from "./a-glyph-beside-the-title";
import * as aPanelKeepsWhatIsInsideIt from "./a-panel-keeps-what-is-inside-it";
import * as alwaysOneOpen from "./always-one-open";
import * as anyNumberAtOnce from "./any-number-at-once";
import * as controlledAndRejected from "./controlled-and-rejected";
import * as disabled from "./disabled";
import * as nothingHasToOptIn from "./nothing-has-to-opt-in";
import * as oneAtATime from "./one-at-a-time";
import * as sizes from "./sizes";
import * as variants from "./variants";
import * as withoutDividers from "./without-dividers";

/** Key order is the gallery's reading order — the selection modes first, the edge cases last. */
export const accordionDemos = defineDemoGroup("accordion", {
	"one-at-a-time": oneAtATime,
	"any-number-at-once": anyNumberAtOnce,
	"always-one-open": alwaysOneOpen,
	variants,
	sizes,
	"a-glyph-beside-the-title": aGlyphBesideTheTitle,
	"a-custom-indicator": aCustomIndicator,
	"a-panel-keeps-what-is-inside-it": aPanelKeepsWhatIsInsideIt,
	"controlled-and-rejected": controlledAndRejected,
	disabled,
	"without-dividers": withoutDividers,
	"nothing-has-to-opt-in": nothingHasToOptIn,
});
