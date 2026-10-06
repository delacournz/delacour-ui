import { defineDemoGroup } from "../define-demo-group";
import * as borderedInCard from "./bordered-in-card";
import * as boundsAndDisabled from "./bounds-and-disabled";
import * as customDay from "./custom-day";
import * as inAField from "./in-a-field";
import * as localeWeekStart from "./locale-week-start";
import * as multiple from "./multiple";
import * as range from "./range";
import * as single from "./single";
import * as sizesVariants from "./sizes-variants";

/** Key order is the gallery's reading order — the three modes, the limits, the axes, then compositions. */
export const calendarDemos = defineDemoGroup("calendar", {
	single,
	range,
	multiple,
	"bounds-and-disabled": boundsAndDisabled,
	"sizes-variants": sizesVariants,
	"bordered-in-card": borderedInCard,
	"custom-day": customDay,
	"locale-week-start": localeWeekStart,
	"in-a-field": inAField,
});
