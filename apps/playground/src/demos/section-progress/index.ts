import { defineDemoGroup } from "../define-demo-group";
import * as article from "./article";
import * as coloredSections from "./colored-sections";
import * as controlledOpen from "./controlled-open";
import * as manualProgress from "./manual-progress";
import * as placements from "./placements";

/** Key order is the gallery's reading order — the pill on a real scroll, its axes, then the two ways a caller takes over. */
export const sectionProgressDemos = defineDemoGroup("section-progress", {
	article,
	placements,
	"colored-sections": coloredSections,
	"manual-progress": manualProgress,
	"controlled-open": controlledOpen,
});
