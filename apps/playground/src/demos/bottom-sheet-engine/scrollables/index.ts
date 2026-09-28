import { defineDemoGroup } from "../../define-demo-group";
import * as dynamicScrollView from "./dynamic-scroll-view";
import * as flatList200Rows from "./flat-list-200-rows";
import * as scrollViewTwoDetents from "./scroll-view-two-detents";
import * as sectionList from "./section-list";

/** The lock first, then the virtualised list, then sizing, then sections under a footer. */
export const bottomSheetEngineScrollablesDemos = defineDemoGroup("bottom-sheet-engine/scrollables", {
	"scroll-view-two-detents": scrollViewTwoDetents,
	"flat-list-200-rows": flatList200Rows,
	"dynamic-scroll-view": dynamicScrollView,
	"section-list": sectionList,
});
