import { defineDemoGroup } from "../define-demo-group";
import * as actions from "./actions";
import * as checkboxAndRadio from "./checkbox-and-radio";
import * as customBackground from "./custom-background";
import * as insetRows from "./inset-rows";
import * as longList from "./long-list";
import * as nearBottomEdge from "./near-bottom-edge";
import * as submenu from "./submenu";

/**
 * Key order is the gallery's reading order — the verbs first, then the two kinds
 * of state row, the submenu, the inset column, the panel at the screen's edge
 * and past the room, and a repainted surface to close.
 */
export const menuDemos = defineDemoGroup("menu", {
	actions,
	"checkbox-and-radio": checkboxAndRadio,
	submenu,
	"inset-rows": insetRows,
	"near-bottom-edge": nearBottomEdge,
	"long-list": longList,
	"custom-background": customBackground,
});
