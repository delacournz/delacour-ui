import { defineDemoGroup } from "../define-demo-group";
import * as dataDriven from "./data-driven";
import * as disabledAndLoading from "./disabled-and-loading";
import * as groupedSearchable from "./grouped-searchable";
import * as inAField from "./in-a-field";
import * as multiple from "./multiple";
import * as single from "./single";

/** Key order is the gallery's reading order — the two modes, the list shapes, then the states. */
export const selectDemos = defineDemoGroup("select", {
	single,
	multiple,
	"grouped-searchable": groupedSearchable,
	"in-a-field": inAField,
	"disabled-and-loading": disabledAndLoading,
	"data-driven": dataDriven,
});
