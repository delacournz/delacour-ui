import { defineDemoGroup } from "../../define-demo-group";
import * as inAForm from "./in-a-form";

/** One demo, because the facet is one screen rather than a set of sections. */
export const fieldFormDemos = defineDemoGroup("field/form", {
	"in-a-form": inAForm,
});
