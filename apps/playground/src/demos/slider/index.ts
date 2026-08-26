import { defineDemoGroup } from "../define-demo-group";
import * as aCustomReadout from "./a-custom-readout";
import * as aRange from "./a-range";
import * as anatomy from "./anatomy";
import * as colours from "./colours";
import * as controlledAndOnChangeEnd from "./controlled-and-on-change-end";
import * as disabledAndInvalid from "./disabled-and-invalid";
import * as insideAField from "./inside-a-field";
import * as panVersusScroll from "./pan-versus-scroll";
import * as sizes from "./sizes";
import * as stepsAndHaptics from "./steps-and-haptics";
import * as vertical from "./vertical";

/** Key order is the gallery's reading order — the anatomy first, the gesture race last. */
export const sliderDemos = defineDemoGroup("slider", {
	anatomy,
	colours,
	sizes,
	"steps-and-haptics": stepsAndHaptics,
	"a-range": aRange,
	vertical,
	"controlled-and-on-change-end": controlledAndOnChangeEnd,
	"a-custom-readout": aCustomReadout,
	"disabled-and-invalid": disabledAndInvalid,
	"inside-a-field": insideAField,
	"pan-versus-scroll": panVersusScroll,
});
