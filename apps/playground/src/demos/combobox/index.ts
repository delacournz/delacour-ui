import { defineDemoGroup } from "../define-demo-group";
import * as asyncServerFilter from "./async-server-filter";
import * as customValue from "./custom-value";
import * as groupedWithDescriptions from "./grouped-with-descriptions";
import * as inFieldInvalid from "./in-field-invalid";
import * as multipleChips from "./multiple-chips";
import * as single from "./single";

/** Key order is the gallery's reading order — the two modes, the data sources, then the field. */
export const comboboxDemos = defineDemoGroup("combobox", {
	single,
	"multiple-chips": multipleChips,
	"async-server-filter": asyncServerFilter,
	"custom-value": customValue,
	"grouped-with-descriptions": groupedWithDescriptions,
	"in-field-invalid": inFieldInvalid,
});
