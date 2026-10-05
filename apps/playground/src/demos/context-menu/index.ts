import { defineDemoGroup } from "../define-demo-group";
import * as anchoredToRow from "./anchored-to-row";
import * as holdTiming from "./hold-timing";
import * as liftedPreview from "./lifted-preview";
import * as messageActions from "./message-actions";
import * as statefulRows from "./stateful-rows";
import * as withOwnPress from "./with-own-press";

/**
 * Key order is the gallery's reading order — the hold itself first, then a tap
 * arbitrated against it, the row anchor, Menu's stateful rows, the lifted
 * preview, and the hold's timing to close.
 */
export const contextMenuDemos = defineDemoGroup("context-menu", {
	"message-actions": messageActions,
	"with-own-press": withOwnPress,
	"anchored-to-row": anchoredToRow,
	"stateful-rows": statefulRows,
	"lifted-preview": liftedPreview,
	"hold-timing": holdTiming,
});
