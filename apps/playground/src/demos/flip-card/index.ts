import { defineDemoGroup } from "../define-demo-group";
import * as anatomy from "./anatomy";
import * as controlled from "./controlled";
import * as faces from "./faces";
import * as flashcard from "./flashcard";
import * as interactiveBack from "./interactive-back";
import * as manual from "./manual";
import * as reducedMotion from "./reduced-motion";
import * as swipe from "./swipe";
import * as verticalAxis from "./vertical-axis";

/** Key order is the gallery's reading order — the tap, the two other triggers, the axis and the faces, then the edge cases. */
export const flipCardDemos = defineDemoGroup("flip-card", {
	anatomy,
	swipe,
	flashcard,
	"vertical-axis": verticalAxis,
	faces,
	controlled,
	"interactive-back": interactiveBack,
	manual,
	"reduced-motion": reducedMotion,
});
