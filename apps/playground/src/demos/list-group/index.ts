import { defineDemoGroup } from "../define-demo-group";
import * as customSuffix from "./custom-suffix";
import * as disabledRow from "./disabled-row";
import * as dividers from "./dividers";
import * as pressFeedback from "./press-feedback";
import * as sizes from "./sizes";
import * as titleOnly from "./title-only";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the surfaces first, the dividers last. */
export const listGroupDemos = defineDemoGroup("list-group", {
	variants,
	sizes,
	"title-only": titleOnly,
	"custom-suffix": customSuffix,
	"press-feedback": pressFeedback,
	"disabled-row": disabledRow,
	dividers,
});
