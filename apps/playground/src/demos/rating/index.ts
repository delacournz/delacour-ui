import { defineDemoGroup } from "../define-demo-group";
import * as aReview from "./a-review";
import * as allowClear from "./allow-clear";
import * as anatomy from "./anatomy";
import * as colours from "./colours";
import * as controlled from "./controlled";
import * as disabledAndInvalid from "./disabled-and-invalid";
import * as halfStars from "./half-stars";
import * as moreStars from "./more-stars";
import * as readOnly from "./read-only";
import * as sizes from "./sizes";

/** Key order is the gallery's reading order — the parts, precision, the axes, state, then a composition. */
export const ratingDemos = defineDemoGroup("rating", {
	anatomy,
	"half-stars": halfStars,
	colours,
	sizes,
	"read-only": readOnly,
	controlled,
	"allow-clear": allowClear,
	"more-stars": moreStars,
	"disabled-and-invalid": disabledAndInvalid,
	"a-review": aReview,
});
