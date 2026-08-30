import { defineDemoGroup } from "../define-demo-group";
import * as asChild from "./as-child";
import * as disabledAndBusy from "./disabled-and-busy";
import * as haptics from "./haptics";
import * as namedFeedback from "./named-feedback";

/** Key order is the gallery's reading order — the feedback scale, then the states, then the haptic vocabulary, then composition. */
export const pressableDemos = defineDemoGroup("pressable", {
	"named-feedback": namedFeedback,
	"disabled-and-busy": disabledAndBusy,
	haptics,
	"as-child": asChild,
});
