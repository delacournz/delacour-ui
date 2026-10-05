import { defineDemoGroup } from "../define-demo-group";
import * as bothSides from "./both-sides";
import * as imperative from "./imperative";
import * as keptOpen from "./kept-open";
import * as noFullSwipe from "./no-full-swipe";
import * as oneOpenAtATime from "./one-open-at-a-time";
import * as swipeToDelete from "./swipe-to-delete";

/**
 * Key order is the gallery's reading order — the gesture end to end, both
 * sides, the group, then the two switches on what a release does, and the ref
 * to close.
 */
export const swipeDemos = defineDemoGroup("swipe", {
	"swipe-to-delete": swipeToDelete,
	"both-sides": bothSides,
	"one-open-at-a-time": oneOpenAtATime,
	"no-full-swipe": noFullSwipe,
	"kept-open": keptOpen,
	imperative,
});
