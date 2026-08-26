import { defineDemoGroup } from "../../define-demo-group";
import * as everyVariant from "./every-variant";

/** One demo: the map over `TABS_VARIANTS` is what makes a variant added to the library show up here. */
export const tabsVariantsDemos = defineDemoGroup("tabs/variants", {
	"every-variant": everyVariant,
});
