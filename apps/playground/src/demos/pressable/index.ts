import { defineDemoGroup } from "../define-demo-group";
import * as asChild from "./as-child";
import * as disabledAndBusy from "./disabled-and-busy";
import * as explicitValues from "./explicit-values";
import * as haptics from "./haptics";
import * as longPress from "./long-press";
import * as namedFeedback from "./named-feedback";
import * as scrollCheck from "./scroll-check";

/** Key order is the gallery's reading order — the feedback vocabulary first, the gesture check last. */
export const pressableDemos = defineDemoGroup("pressable", {
	"named-feedback": namedFeedback,
	"explicit-values": explicitValues,
	haptics,
	"long-press": longPress,
	"disabled-and-busy": disabledAndBusy,
	"as-child": asChild,
	"scroll-check": scrollCheck,
});
