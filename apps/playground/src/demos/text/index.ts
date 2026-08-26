import { defineDemoGroup } from "../define-demo-group";
import * as alignment from "./alignment";
import * as code from "./code";
import * as colour from "./colour";
import * as inlinePresets from "./inline-presets";
import * as insideOtherComponents from "./inside-other-components";
import * as nesting from "./nesting";
import * as size from "./size";
import * as transform from "./transform";
import * as truncation from "./truncation";
import * as typeScale from "./type-scale";
import * as weight from "./weight";

/** Key order is the gallery's reading order — the scale first, then the axes, then Text inside something else. */
export const textDemos = defineDemoGroup("text", {
	"type-scale": typeScale,
	"inline-presets": inlinePresets,
	nesting,
	size,
	colour,
	weight,
	alignment,
	transform,
	code,
	truncation,
	"inside-other-components": insideOtherComponents,
});
