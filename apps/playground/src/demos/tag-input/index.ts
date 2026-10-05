import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as emailValidation from "./email-validation";
import * as inFieldWithClear from "./in-field-with-clear";
import * as maxAndCounter from "./max-and-counter";
import * as overflowInvalid from "./overflow-invalid";
import * as sizesAndVariants from "./sizes-and-variants";

/** Key order is the gallery's reading order — typing first, then the rules, then the matrix. */
export const tagInputDemos = defineDemoGroup("tag-input", {
	basic,
	"email-validation": emailValidation,
	"max-and-counter": maxAndCounter,
	"overflow-invalid": overflowInvalid,
	"in-field-with-clear": inFieldWithClear,
	"sizes-and-variants": sizesAndVariants,
});
