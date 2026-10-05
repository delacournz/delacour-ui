import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as conditional from "./conditional";
import * as controlled from "./controlled";
import * as progressVariants from "./progress-variants";
import * as textAndScale from "./text-and-scale";
import * as unframedInSheet from "./unframed-in-sheet";
import * as validation from "./validation";

/** Key order is the gallery's reading order — the default flow, its parts, branching and kinds, rules, then hosting. */
export const questionnaireDemos = defineDemoGroup("questionnaire", {
	basic,
	"progress-variants": progressVariants,
	conditional,
	"text-and-scale": textAndScale,
	validation,
	controlled,
	"unframed-in-sheet": unframedInSheet,
});
