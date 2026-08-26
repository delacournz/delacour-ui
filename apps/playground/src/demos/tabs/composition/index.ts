import { defineDemoGroup } from "../../define-demo-group";
import * as aRestyledIndicatorAndADisabledTab from "./a-restyled-indicator-and-a-disabled-tab";
import * as aScrollerInsideAPanel from "./a-scroller-inside-a-panel";
import * as composedIconsAndARenderProp from "./composed-icons-and-a-render-prop";
import * as separators from "./separators";

/** Key order is the gallery's reading order — the compound parts first, the nested gestures last. */
export const tabsCompositionDemos = defineDemoGroup("tabs/composition", {
	separators,
	"composed-icons-and-a-render-prop": composedIconsAndARenderProp,
	"a-restyled-indicator-and-a-disabled-tab": aRestyledIndicatorAndADisabledTab,
	"a-scroller-inside-a-panel": aScrollerInsideAPanel,
});
