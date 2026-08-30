import { defineDemoGroup } from "../define-demo-group";
import * as alignment from "./alignment";
import * as colour from "./colour";
import * as inlinePresets from "./inline-presets";
import * as size from "./size";
import * as typeScale from "./type-scale";
import * as weight from "./weight";

/** Key order is the gallery's reading order — the preset scale, then each axis it can be tuned on. */
export const textDemos = defineDemoGroup("text", {
	"type-scale": typeScale,
	size,
	weight,
	colour,
	alignment,
	"inline-presets": inlinePresets,
});
