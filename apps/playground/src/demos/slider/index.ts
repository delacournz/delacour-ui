import { defineDemoGroup } from "../define-demo-group";
import * as aRange from "./a-range";
import * as accessibleNames from "./accessible-names";
import * as anatomy from "./anatomy";
import * as colours from "./colours";
import * as disabledAndInvalid from "./disabled-and-invalid";
import * as sizes from "./sizes";
import * as vertical from "./vertical";

/** Key order is the gallery's reading order — the parts, then the axes, then orientation, range and states. */
export const sliderDemos = defineDemoGroup("slider", {
	anatomy,
	colours,
	sizes,
	vertical,
	"a-range": aRange,
	"accessible-names": accessibleNames,
	"disabled-and-invalid": disabledAndInvalid,
});
