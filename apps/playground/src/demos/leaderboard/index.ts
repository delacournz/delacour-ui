import { defineDemoGroup } from "../define-demo-group";
import * as ascendingTimes from "./ascending-times";
import * as bars from "./bars";
import * as cards from "./cards";
import * as empty from "./empty";
import * as highlightPinned from "./highlight-pinned";
import * as movement from "./movement";
import * as pressable from "./pressable";
import * as ties from "./ties";
import * as withAvatars from "./with-avatars";

/** Key order is the gallery's reading order — the two podiums, ranking rules, the cut, then composition and states. */
export const leaderboardDemos = defineDemoGroup("leaderboard", {
	bars,
	cards,
	"ascending-times": ascendingTimes,
	ties,
	"highlight-pinned": highlightPinned,
	movement,
	"with-avatars": withAvatars,
	pressable,
	empty,
});
