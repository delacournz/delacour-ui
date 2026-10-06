import { defineDemoGroup } from "../define-demo-group";
import * as alertDialog from "./alert-dialog";
import * as confirm from "./confirm";
import * as controlled from "./controlled";
import * as form from "./form";
import * as overSheet from "./over-sheet";
import * as sizes from "./sizes";

/** Key order is the gallery's reading order — the hero, the alert dialog, a form, the sizes, then control and z-order. */
export const dialogDemos = defineDemoGroup("dialog", {
	confirm,
	"alert-dialog": alertDialog,
	form,
	sizes,
	controlled,
	"over-sheet": overSheet,
});
