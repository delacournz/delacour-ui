import { defineDemoGroup } from "../define-demo-group";
import * as complete from "./complete";
import * as inline from "./inline";
import * as labels from "./labels";
import * as segmented from "./segmented";
import * as sizes from "./sizes";
import * as units from "./units";
import * as urgent from "./urgent";

/** Key order is the gallery's reading order — the two variants, the sizes, which units, urgency, completion, then localised captions. */
export const countdownDemos = defineDemoGroup("countdown", {
	segmented,
	inline,
	sizes,
	units,
	urgent,
	complete,
	labels,
});
