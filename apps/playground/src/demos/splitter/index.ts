import { defineDemoGroup } from "../define-demo-group";
import * as accessibleNames from "./accessible-names";
import * as anatomy from "./anatomy";
import * as collapsible from "./collapsible";
import * as controlled from "./controlled";
import * as disabled from "./disabled";
import * as panes from "./panes";
import * as threeColumns from "./three-columns";
import * as vertical from "./vertical";

/** Key order is the gallery's reading order — the parts, the variant, the axes, then collapse, control and states. */
export const splitterDemos = defineDemoGroup("splitter", {
	anatomy,
	panes,
	"three-columns": threeColumns,
	vertical,
	collapsible,
	controlled,
	"accessible-names": accessibleNames,
	disabled,
});
