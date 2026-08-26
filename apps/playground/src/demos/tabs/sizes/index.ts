import { defineDemoGroup } from "../../define-demo-group";
import * as everySize from "./every-size";

/** One demo: the map over `TABS_SIZES` is what makes a size added to the library show up here. */
export const tabsSizesDemos = defineDemoGroup("tabs/sizes", {
	"every-size": everySize,
});
