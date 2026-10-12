import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as columns from "./columns";
import * as empty from "./empty";
import * as frame from "./frame";
import * as selectable from "./selectable";
import * as sortable from "./sortable";
import * as stripedSmall from "./striped-small";
import * as virtualised from "./virtualised";
import * as wideScroll from "./wide-scroll";

/** Key order is the gallery's reading order — the shape, the columns, the interactions, then tables in use. */
export const tableDemos = defineDemoGroup("table", {
	basic,
	columns,
	sortable,
	selectable,
	"striped-small": stripedSmall,
	frame,
	"wide-scroll": wideScroll,
	empty,
	virtualised,
});
