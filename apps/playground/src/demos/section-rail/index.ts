import { defineDemoGroup } from "../define-demo-group";
import * as center from "./center";
import * as controlledOpen from "./controlled-open";
import * as docsPage from "./docs-page";
import * as nestedLevels from "./nested-levels";
import * as pager from "./pager";
import * as startEdge from "./start-edge";

/** Key order is the gallery's reading order — the real use first, then placement, nesting, and the two ways a caller drives it. */
export const sectionRailDemos = defineDemoGroup("section-rail", {
	"docs-page": docsPage,
	center,
	"start-edge": startEdge,
	"nested-levels": nestedLevels,
	pager,
	"controlled-open": controlledOpen,
});
