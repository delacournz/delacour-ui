import { defineDemoGroup } from "../define-demo-group";
import * as insets from "./insets";
import * as insideAListGroup from "./inside-a-list-group";
import * as orientationTokens from "./orientation-tokens";
import * as orientations from "./orientations";
import * as stretchingToAParent from "./stretching-to-a-parent";
import * as weightAndColour from "./weight-and-colour";

/** Key order is the gallery's reading order — the two orientations first, the tokens last. */
export const separatorDemos = defineDemoGroup("separator", {
	orientations,
	insets,
	"weight-and-colour": weightAndColour,
	"stretching-to-a-parent": stretchingToAParent,
	"inside-a-list-group": insideAListGroup,
	"orientation-tokens": orientationTokens,
});
