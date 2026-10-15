import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as dateSeparators from "./date-separators";
import * as empty from "./empty";
import * as jumpToLatest from "./jump-to-latest";
import * as keyboard from "./keyboard";
import * as loadOlder from "./load-older";
import * as stickToBottom from "./stick-to-bottom";
import * as unreadDivider from "./unread-divider";

/** Key order is the gallery's reading order — the list, its scroll behaviour, the rows it inserts, then the edges. */
export const messageScrollerDemos = defineDemoGroup("message-scroller", {
	basic,
	"stick-to-bottom": stickToBottom,
	"jump-to-latest": jumpToLatest,
	"load-older": loadOlder,
	"date-separators": dateSeparators,
	"unread-divider": unreadDivider,
	keyboard,
	empty,
});
