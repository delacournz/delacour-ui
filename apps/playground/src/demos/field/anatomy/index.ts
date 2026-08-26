import { defineDemoGroup } from "../../define-demo-group";
import * as allFour from "./all-four";
import * as labelAndControl from "./label-and-control";
import * as theGapLadder from "./the-gap-ladder";
import * as withADescription from "./with-a-description";
import * as withAnError from "./with-an-error";

/** Key order is the gallery's reading order — the parts accumulate, and the rhythm holding them apart comes last. */
export const fieldAnatomyDemos = defineDemoGroup("field/anatomy", {
	"label-and-control": labelAndControl,
	"with-a-description": withADescription,
	"with-an-error": withAnError,
	"all-four": allFour,
	"the-gap-ladder": theGapLadder,
});
