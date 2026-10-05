import { defineDemoGroup } from "../define-demo-group";
import * as basicSheet from "./basic-sheet";
import * as bounds from "./bounds";
import * as inFieldInvalid from "./in-field-invalid";
import * as inlineWheel from "./inline-wheel";
import * as minuteStep15 from "./minute-step-15";
import * as twentyFourHour from "./twenty-four-hour";
import * as withSeconds from "./with-seconds";

/** Key order is the gallery's reading order — the sheet, its options, the inline wheel, then a field. */
export const timePickerDemos = defineDemoGroup("time-picker", {
	"basic-sheet": basicSheet,
	"minute-step-15": minuteStep15,
	"twenty-four-hour": twentyFourHour,
	bounds,
	"inline-wheel": inlineWheel,
	"with-seconds": withSeconds,
	"in-field-invalid": inFieldInvalid,
});
