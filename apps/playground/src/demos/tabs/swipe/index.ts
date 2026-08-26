import { defineDemoGroup } from "../../define-demo-group";
import * as aTabInsertedBeforeTheActiveOne from "./a-tab-inserted-before-the-active-one";
import * as controlledRejectingEveryThirdChange from "./controlled-rejecting-every-third-change";
import * as isSwipeableFalse from "./is-swipeable-false";
import * as swipeableTheDefault from "./swipeable-the-default";

/** Key order is the gallery's reading order — the gesture first, then the paths that only exist because of it. */
export const tabsSwipeDemos = defineDemoGroup("tabs/swipe", {
	"swipeable-the-default": swipeableTheDefault,
	"is-swipeable-false": isSwipeableFalse,
	"controlled-rejecting-every-third-change": controlledRejectingEveryThirdChange,
	"a-tab-inserted-before-the-active-one": aTabInsertedBeforeTheActiveOne,
});
