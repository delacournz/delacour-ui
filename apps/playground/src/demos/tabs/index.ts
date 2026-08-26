import { concatDemoGroups } from "../define-demo-group";
import { tabsCompositionDemos } from "./composition";
import { tabsScrollingDemos } from "./scrolling";
import { tabsSizesDemos } from "./sizes";
import { tabsSwipeDemos } from "./swipe";
import { tabsVariantsDemos } from "./variants";

/** Facet order — the order the Tabs index lists its five pages. */
export const tabsDemos = concatDemoGroups(
	tabsVariantsDemos,
	tabsSizesDemos,
	tabsSwipeDemos,
	tabsScrollingDemos,
	tabsCompositionDemos
);
