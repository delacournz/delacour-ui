import { defineDemoGroup } from "../define-demo-group";
import * as controlledExpanded from "./controlled-expanded";
import * as fileBrowser from "./file-browser";
import * as lazyLoad from "./lazy-load";
import * as lines from "./lines";
import * as multiSelect from "./multi-select";
import * as singleSelect from "./single-select";
import * as sizes from "./sizes";

/** Key order is the gallery's reading order — a whole browser, the selection modes, the axes, then the data patterns. */
export const treeDemos = defineDemoGroup("tree", {
	"file-browser": fileBrowser,
	"single-select": singleSelect,
	"multi-select": multiSelect,
	lines,
	sizes,
	"lazy-load": lazyLoad,
	"controlled-expanded": controlledExpanded,
});
