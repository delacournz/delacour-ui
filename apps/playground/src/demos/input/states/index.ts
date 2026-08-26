import { defineDemoGroup } from "../../define-demo-group";
import * as keyboards from "./keyboards";
import * as liveValidation from "./live-validation";
import * as notEditable from "./not-editable";
import * as secure from "./secure";

/** Key order is the gallery's reading order — the states the field reports first, the inherited props last. */
export const inputStatesDemos = defineDemoGroup("input/states", {
	"live-validation": liveValidation,
	"not-editable": notEditable,
	secure,
	keyboards,
});
