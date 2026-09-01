import { defineDemoGroup } from "../define-demo-group";
import * as disabled from "./disabled";
import * as group from "./group";
import * as groupInput from "./group-input";
import * as groupOrientation from "./group-orientation";
import * as groupSeparator from "./group-separator";
import * as groupText from "./group-text";
import * as iconButton from "./icon-button";
import * as icons from "./icons";
import * as loading from "./loading";
import * as sizes from "./sizes";
import * as variants from "./variants";

/**
 * Key order is the gallery's reading order — the two axes, then the states, then
 * the icons, then the group and its parts. The group comes last because it is
 * the one section that assumes the rest: a run of buttons only reads as one
 * control once a button on its own does.
 */
export const buttonDemos = defineDemoGroup("button", {
	variants,
	sizes,
	disabled,
	loading,
	icons,
	"icon-button": iconButton,
	group,
	"group-orientation": groupOrientation,
	"group-separator": groupSeparator,
	"group-text": groupText,
	"group-input": groupInput,
});
