import { defineDemoGroup } from "../../define-demo-group";
import * as fewerTabsThanRoom from "./fewer-tabs-than-room";
import * as twelveTabs from "./twelve-tabs";

/** Key order is the gallery's reading order — the crowded row first, the row with room to spare after it. */
export const tabsScrollingDemos = defineDemoGroup("tabs/scrolling", {
	"twelve-tabs": twelveTabs,
	"fewer-tabs-than-room": fewerTabsThanRoom,
});
