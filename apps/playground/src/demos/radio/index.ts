import { defineDemoGroup } from "../define-demo-group";
import * as controlled from "./controlled";
import * as customIndicator from "./custom-indicator";
import * as disabledAndTheStateLadder from "./disabled-and-the-state-ladder";
import * as horizontalWrapping from "./horizontal-wrapping";
import * as insideAField from "./inside-a-field";
import * as longLabelInANarrowColumn from "./long-label-in-a-narrow-column";
import * as perOptionDescription from "./per-option-description";
import * as sizes from "./sizes";
import * as trailingIndicatorAsASettingsRow from "./trailing-indicator-as-a-settings-row";
import * as uncontrolled from "./uncontrolled";
import * as variantsAndStates from "./variants-and-states";

/** Key order is the gallery's reading order — the axes first, the edge cases last. */
export const radioDemos = defineDemoGroup("radio", {
	"variants-and-states": variantsAndStates,
	sizes,
	controlled,
	uncontrolled,
	"horizontal-wrapping": horizontalWrapping,
	"per-option-description": perOptionDescription,
	"inside-a-field": insideAField,
	"trailing-indicator-as-a-settings-row": trailingIndicatorAsASettingsRow,
	"disabled-and-the-state-ladder": disabledAndTheStateLadder,
	"custom-indicator": customIndicator,
	"long-label-in-a-narrow-column": longLabelInANarrowColumn,
});
