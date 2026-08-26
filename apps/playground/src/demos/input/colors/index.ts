import { defineDemoGroup } from "../../define-demo-group";
import * as caretAndSelection from "./caret-and-selection";
import * as defaults from "./defaults";
import * as invalidWinsByDefault from "./invalid-wins-by-default";
import * as placeholder from "./placeholder";

/** Key order is the gallery's reading order — the theme's own colours first, the override rule last. */
export const inputColorsDemos = defineDemoGroup("input/colors", {
	defaults,
	placeholder,
	"caret-and-selection": caretAndSelection,
	"invalid-wins-by-default": invalidWinsByDefault,
});
