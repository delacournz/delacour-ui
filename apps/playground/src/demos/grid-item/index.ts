import { defineDemoGroup } from "../define-demo-group";
import * as backgrounds from "./backgrounds";
import * as dashboard from "./dashboard";
import * as interactive from "./interactive";
import * as quickActions from "./quick-actions";
import * as rowSizing from "./row-sizing";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the bento first, then the axes, then tiles in use. */
export const gridItemDemos = defineDemoGroup("grid-item", {
	dashboard,
	variants,
	interactive,
	backgrounds,
	"quick-actions": quickActions,
	"row-sizing": rowSizing,
});
