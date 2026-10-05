import { defineDemoGroup } from "../define-demo-group";
import * as alignedStart from "./aligned-start";
import * as cardInList from "./card-in-list";
import * as gradientCover from "./gradient-cover";
import * as noCover from "./no-cover";
import * as profile from "./profile";
import * as stats from "./stats";

/** Key order is the gallery's reading order — the whole header, its cover, its alignment, its stats, the card, then the bare and loading states. */
export const pageHeaderDemos = defineDemoGroup("page-header", {
	profile,
	"gradient-cover": gradientCover,
	"aligned-start": alignedStart,
	stats,
	"card-in-list": cardInList,
	"no-cover": noCover,
});
