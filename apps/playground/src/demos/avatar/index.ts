import { defineDemoGroup } from "../define-demo-group";
import * as fallbacks from "./fallbacks";
import * as group from "./group";
import * as groupSizesAndOverlap from "./group-sizes-and-overlap";
import * as imageRetry from "./image-retry";
import * as presence from "./presence";
import * as pressableAndDisabled from "./pressable-and-disabled";
import * as sharedWith from "./shared-with";
import * as sizes from "./sizes";
import * as unreadCount from "./unread-count";
import * as variantsAndColours from "./variants-and-colours";

/** Key order is the gallery's reading order — what an avatar draws, its axes, its overlays, its states, then the stack and a screen that uses it. */
export const avatarDemos = defineDemoGroup("avatar", {
	fallbacks,
	sizes,
	"variants-and-colours": variantsAndColours,
	presence,
	"unread-count": unreadCount,
	"image-retry": imageRetry,
	"pressable-and-disabled": pressableAndDisabled,
	group,
	"group-sizes-and-overlap": groupSizesAndOverlap,
	"shared-with": sharedWith,
});
