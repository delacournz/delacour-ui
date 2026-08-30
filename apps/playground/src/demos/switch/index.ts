import { defineDemoGroup } from "../define-demo-group";
import * as colours from "./colours";
import * as disabledAndInvalid from "./disabled-and-invalid";
import * as sizes from "./sizes";
import * as startAndEndContent from "./start-and-end-content";
import * as tapOrDrag from "./tap-or-drag";

/** Key order is the gallery's reading order — the gesture, then the two axes, then the states and the slots. */
export const switchDemos = defineDemoGroup("switch", {
	"tap-or-drag": tapOrDrag,
	colours,
	sizes,
	"disabled-and-invalid": disabledAndInvalid,
	"start-and-end-content": startAndEndContent,
});
