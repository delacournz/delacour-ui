import { defineDemoGroup } from "../define-demo-group";
import * as disabled from "./disabled";
import * as iconButton from "./icon-button";
import * as icons from "./icons";
import * as loading from "./loading";
import * as sizes from "./sizes";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the two axes, then the states, then the icons. */
export const buttonDemos = defineDemoGroup("button", {
	variants,
	sizes,
	disabled,
	loading,
	icons,
	"icon-button": iconButton,
});
