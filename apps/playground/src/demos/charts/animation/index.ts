import { defineDemoGroup } from "../../define-demo-group";
import * as morph from "./morph";
import * as spring from "./spring";

/** Key order is the reading order — the default morph, then the same change on a spring. */
export const chartsAnimationDemos = defineDemoGroup("charts/animation", {
	morph,
	spring,
});
