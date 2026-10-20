import { defineDemoGroup } from "../define-demo-group";
import * as compact from "./compact";
import * as controlledList from "./controlled-list";
import * as disabled from "./disabled";
import * as numbers from "./numbers";
import * as simple from "./simple";
import * as sizes from "./sizes";
import * as withSummary from "./with-summary";

/** Key order is the gallery's reading order — the three variants, the sizes, a composition, a real list, then the disabled state. */
export const paginationDemos = defineDemoGroup("pagination", {
	numbers,
	compact,
	simple,
	sizes,
	"with-summary": withSummary,
	"controlled-list": controlledList,
	disabled,
});
