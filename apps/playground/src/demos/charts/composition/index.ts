import { defineDemoGroup } from "../../define-demo-group";
import * as declarative from "./declarative";
import * as mixed from "./mixed";
import * as renderProp from "./render-prop";

/** Key order is the reading order — the render prop, the same chart placed, then two marks on one root. */
export const chartsCompositionDemos = defineDemoGroup("charts/composition", {
	"render-prop": renderProp,
	declarative,
	mixed,
});
