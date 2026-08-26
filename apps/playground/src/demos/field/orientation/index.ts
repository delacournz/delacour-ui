import { defineDemoGroup } from "../../define-demo-group";
import * as horizontal from "./horizontal";
import * as horizontalAndDisabled from "./horizontal-and-disabled";
import * as horizontalAndInvalid from "./horizontal-and-invalid";
import * as horizontalWithADescription from "./horizontal-with-a-description";
import * as vertical from "./vertical";

/** Key order is the gallery's reading order — the default first, then the horizontal axis and the states it carries. */
export const fieldOrientationDemos = defineDemoGroup("field/orientation", {
	vertical,
	horizontal,
	"horizontal-with-a-description": horizontalWithADescription,
	"horizontal-and-invalid": horizontalAndInvalid,
	"horizontal-and-disabled": horizontalAndDisabled,
});
