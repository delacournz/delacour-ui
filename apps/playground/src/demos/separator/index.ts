import { defineDemoGroup } from "../define-demo-group";
import * as insideAListGroup from "./inside-a-list-group";
import * as orientations from "./orientations";
import * as weightAndColour from "./weight-and-colour";

/** Key order is the gallery's reading order — the axis, then the paint, then it doing its job. */
export const separatorDemos = defineDemoGroup("separator", {
	orientations,
	"weight-and-colour": weightAndColour,
	"inside-a-list-group": insideAListGroup,
});
