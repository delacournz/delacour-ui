import { defineDemoGroup } from "../define-demo-group";
import * as composerTray from "./composer-tray";
import * as inMessage from "./in-message";
import * as kinds from "./kinds";
import * as layouts from "./layouts";
import * as pressableAndDisabled from "./pressable-and-disabled";
import * as sizes from "./sizes";
import * as truncation from "./truncation";
import * as uploadStates from "./upload-states";

/** Key order is the gallery's reading order — the layouts, the kinds, the upload, the tray, then the edges. */
export const attachmentDemos = defineDemoGroup("attachment", {
	layouts,
	kinds,
	"upload-states": uploadStates,
	"composer-tray": composerTray,
	"in-message": inMessage,
	sizes,
	truncation,
	"pressable-and-disabled": pressableAndDisabled,
});
