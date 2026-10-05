import { defineDemoGroup } from "../define-demo-group";
import * as decisionFooter from "./decision-footer";
import * as members from "./members";
import * as sections from "./sections";
import * as settings from "./settings";
import * as sizes from "./sizes";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the shape, the axes, then frames in use. */
export const frameDemos = defineDemoGroup("frame", {
	settings,
	variants,
	sections,
	"decision-footer": decisionFooter,
	members,
	sizes,
});
