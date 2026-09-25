import { defineDemoGroup } from "../define-demo-group";
import * as controlledAndUncontrolled from "./controlled-and-uncontrolled";
import * as filterRow from "./filter-row";
import * as recipients from "./recipients";
import * as removable from "./removable";
import * as singleSelect from "./single-select";
import * as sizes from "./sizes";
import * as states from "./states";
import * as tags from "./tags";
import * as variantsAndColours from "./variants-and-colours";
import * as withContent from "./with-content";

/** Key order is the gallery's reading order — the composed filter first, then the matrix, then each behaviour on its own. */
export const chipDemos = defineDemoGroup("chip", {
	"filter-row": filterRow,
	"variants-and-colours": variantsAndColours,
	sizes,
	"single-select": singleSelect,
	"controlled-and-uncontrolled": controlledAndUncontrolled,
	removable,
	"with-content": withContent,
	tags,
	states,
	recipients,
});
