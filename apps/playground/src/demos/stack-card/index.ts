import { defineDemoGroup } from "../define-demo-group";
import * as controlledDecline from "./controlled-decline";
import * as empty from "./empty";
import * as fourDirections from "./four-directions";
import * as largeDeck from "./large-deck";
import * as layouts from "./layouts";
import * as reviewQueue from "./review-queue";
import * as undo from "./undo";

/**
 * Key order is the gallery's reading order — the deck as it is meant to be
 * used, then its two axes, then undo and the controlled decline, and the edges
 * last: an empty deck, and a long one.
 */
export const stackCardDemos = defineDemoGroup("stack-card", {
	"review-queue": reviewQueue,
	layouts,
	"four-directions": fourDirections,
	undo,
	"controlled-decline": controlledDecline,
	empty,
	"large-deck": largeDeck,
});
