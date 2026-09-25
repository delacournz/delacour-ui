import { defineDemoGroup } from "../define-demo-group";
import * as carousel from "./carousel";
import * as controlsInActions from "./controls-in-actions";
import * as headerAndFooter from "./header-and-footer";
import * as inAListGroup from "./in-a-list-group";
import * as inbox from "./inbox";
import * as media from "./media";
import * as selection from "./selection";
import * as sizes from "./sizes";
import * as states from "./states";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the axes, the ListGroup fit, the states, then the compositions. */
export const itemDemos = defineDemoGroup("item", {
	variants,
	sizes,
	media,
	"in-a-list-group": inAListGroup,
	selection,
	states,
	"controls-in-actions": controlsInActions,
	"header-and-footer": headerAndFooter,
	carousel,
	inbox,
});
