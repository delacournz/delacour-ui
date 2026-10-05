import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as debouncedFilterList from "./debounced-filter-list";
import * as inSheet from "./in-sheet";
import * as loadingAndTokens from "./loading-and-tokens";
import * as sizesAndShapes from "./sizes-and-shapes";
import * as withCancel from "./with-cancel";

/** Key order is the gallery's reading order — the plain bar, then what it does, then how it looks, then where it goes. */
export const searchBarDemos = defineDemoGroup("search-bar", {
	basic,
	"debounced-filter-list": debouncedFilterList,
	"with-cancel": withCancel,
	"loading-and-tokens": loadingAndTokens,
	"sizes-and-shapes": sizesAndShapes,
	"in-sheet": inSheet,
});
