import { defineDemoGroup } from "../define-demo-group";
import * as boundsFromNow from "./bounds-from-now";
import * as inFieldInvalid from "./in-field-invalid";
import * as inline from "./inline";
import * as nativeDateInterop from "./native-date-interop";
import * as stackedLayout from "./stacked-layout";
import * as step1524h from "./step-15-24h";
import * as tabsLayout from "./tabs-layout";

/** Key order is the gallery's reading order — the two layouts, the limits, the axes, then compositions. */
export const dateTimePickerDemos = defineDemoGroup("date-time-picker", {
	"tabs-layout": tabsLayout,
	"stacked-layout": stackedLayout,
	"bounds-from-now": boundsFromNow,
	"step-15-24h": step1524h,
	inline,
	"in-field-invalid": inFieldInvalid,
	"native-date-interop": nativeDateInterop,
});
