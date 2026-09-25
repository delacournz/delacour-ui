import { defineDemoGroup } from "../define-demo-group";
import * as actions from "./actions";
import * as anatomy from "./anatomy";
import * as emptiedList from "./emptied-list";
import * as media from "./media";
import * as search from "./search";
import * as sizes from "./sizes";
import * as textOnly from "./text-only";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the parts, the two axes, the media, then real screens. */
export const emptyStateDemos = defineDemoGroup("empty-state", {
	anatomy,
	variants,
	sizes,
	media,
	"text-only": textOnly,
	actions,
	"emptied-list": emptiedList,
	search,
});
