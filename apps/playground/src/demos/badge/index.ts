import { defineDemoGroup } from "../define-demo-group";
import * as composedIcon from "./composed-icon";
import * as disabled from "./disabled";
import * as dismissible from "./dismissible";
import * as longLabelInANarrowColumn from "./long-label-in-a-narrow-column";
import * as pressableAndPressableWithDismiss from "./pressable-and-pressable-with-dismiss";
import * as scrollCheck from "./scroll-check";
import * as sizes from "./sizes";
import * as statusDot from "./status-dot";
import * as trailingIconEveryVariant from "./trailing-icon-every-variant";
import * as variantsAndColours from "./variants-and-colours";

/** Key order is the gallery's reading order — the whole matrix first, the edge cases last. */
export const badgeDemos = defineDemoGroup("badge", {
	"variants-and-colours": variantsAndColours,
	sizes,
	"composed-icon": composedIcon,
	"trailing-icon-every-variant": trailingIconEveryVariant,
	"status-dot": statusDot,
	dismissible,
	"pressable-and-pressable-with-dismiss": pressableAndPressableWithDismiss,
	disabled,
	"long-label-in-a-narrow-column": longLabelInANarrowColumn,
	"scroll-check": scrollCheck,
});
