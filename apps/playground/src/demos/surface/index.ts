import { defineDemoGroup } from "../define-demo-group";
import * as bleed from "./bleed";
import * as configurator from "./configurator";
import * as nesting from "./nesting";
import * as padding from "./padding";
import * as securityCard from "./security-card";
import * as transparent from "./transparent";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the two axes, the ladder they build, then a surface in use. */
export const surfaceDemos = defineDemoGroup("surface", {
	variants,
	padding,
	configurator,
	nesting,
	transparent,
	bleed,
	"security-card": securityCard,
});
