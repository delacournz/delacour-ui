import { defineDemoGroup } from "../define-demo-group";
import * as characters from "./characters";
import * as colour from "./colour";
import * as highlight from "./highlight";
import * as lines from "./lines";
import * as rise from "./rise";
import * as scrub from "./scrub";

/** Key order is the gallery's reading order — the default effect, the other three, the two other splits, then by hand. */
export const scrollTextDemos = defineDemoGroup("scroll-text", {
	colour,
	rise,
	highlight,
	characters,
	lines,
	scrub,
});
