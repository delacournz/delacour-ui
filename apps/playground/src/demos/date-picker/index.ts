import { defineDemoGroup } from "../define-demo-group";
import * as boundsAndDisabledWeekends from "./bounds-and-disabled-weekends";
import * as controlledOpen from "./controlled-open";
import * as customFormatLocale from "./custom-format-locale";
import * as inFieldInvalid from "./in-field-invalid";
import * as multiple from "./multiple";
import * as rangeBooking from "./range-booking";
import * as single from "./single";
import * as sizesVariants from "./sizes-variants";

/** Key order is the gallery's reading order — the three modes, the limits, the axes, then compositions. */
export const datePickerDemos = defineDemoGroup("date-picker", {
	single,
	"range-booking": rangeBooking,
	multiple,
	"bounds-and-disabled-weekends": boundsAndDisabledWeekends,
	"sizes-variants": sizesVariants,
	"in-field-invalid": inFieldInvalid,
	"controlled-open": controlledOpen,
	"custom-format-locale": customFormatLocale,
});
