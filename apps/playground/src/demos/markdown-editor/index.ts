import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as controlledMode from "./controlled-mode";
import * as customToolbar from "./custom-toolbar";
import * as disabledReadOnly from "./disabled-read-only";
import * as inField from "./in-field";
import * as pillToolbar from "./pill-toolbar";
import * as previewMode from "./preview-mode";

/** Key order is the gallery's reading order — writing first, then what it renders to, the two toolbars, a form and the states. */
export const markdownEditorDemos = defineDemoGroup("markdown-editor", {
	basic,
	"preview-mode": previewMode,
	"custom-toolbar": customToolbar,
	"pill-toolbar": pillToolbar,
	"in-field": inField,
	"controlled-mode": controlledMode,
	"disabled-read-only": disabledReadOnly,
});
