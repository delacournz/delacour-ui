import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as controlled from "./controlled";
import * as disabledInvalid from "./disabled-invalid";
import * as formats from "./formats";
import * as sheetTrigger from "./sheet-trigger";
import * as sizes from "./sizes";
import * as swatches from "./swatches";
import * as withAlpha from "./with-alpha";

/** Key order is the gallery's reading order — the bare picker, its options, presentation, the axes, then state. */
export const colorPickerDemos = defineDemoGroup("color-picker", {
	basic,
	"with-alpha": withAlpha,
	swatches,
	"sheet-trigger": sheetTrigger,
	formats,
	sizes,
	controlled,
	"disabled-invalid": disabledInvalid,
});
