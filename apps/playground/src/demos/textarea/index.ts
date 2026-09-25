import { defineDemoGroup } from "../define-demo-group";
import * as autoGrow from "./auto-grow";
import * as characterCount from "./character-count";
import * as controlled from "./controlled";
import * as feedbackForm from "./feedback-form";
import * as rows from "./rows";
import * as sizes from "./sizes";
import * as states from "./states";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the height first, then the two axes, the states, and a form last. */
export const textareaDemos = defineDemoGroup("textarea", {
	rows,
	"auto-grow": autoGrow,
	"character-count": characterCount,
	variants,
	sizes,
	states,
	controlled,
	"feedback-form": feedbackForm,
});
