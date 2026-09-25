import { defineDemoGroup } from "../define-demo-group";
import * as aCustomIndicator from "./a-custom-indicator";
import * as aSectionOfDetail from "./a-section-of-detail";
import * as controlled from "./controlled";
import * as disabled from "./disabled";
import * as orderSummary from "./order-summary";
import * as sizes from "./sizes";
import * as startsOpen from "./starts-open";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the default, the two axes, how state is held, the state, the indicator slot, then a real screen. */
export const collapsibleDemos = defineDemoGroup("collapsible", {
	"a-section-of-detail": aSectionOfDetail,
	variants,
	sizes,
	"starts-open": startsOpen,
	controlled,
	disabled,
	"a-custom-indicator": aCustomIndicator,
	"order-summary": orderSummary,
});
