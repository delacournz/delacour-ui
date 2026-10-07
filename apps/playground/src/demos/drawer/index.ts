import { defineDemoGroup } from "../define-demo-group";
import * as controlled from "./controlled";
import * as filters from "./filters";
import * as navigation from "./navigation";
import * as notifications from "./notifications";
import * as rtl from "./rtl";
import * as sizes from "./sizes";

/** Key order is the gallery's reading order — the hero, the end and top edges, the sizes, then direction and control. */
export const drawerDemos = defineDemoGroup("drawer", {
	navigation,
	filters,
	notifications,
	sizes,
	rtl,
	controlled,
});
