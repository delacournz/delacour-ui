import { defineDemoGroup } from "../define-demo-group";
import * as compactTimeline from "./compact-timeline";
import * as expandableBody from "./expandable-body";
import * as feedCard from "./feed-card";
import * as hashtagsAndMentions from "./hashtags-and-mentions";
import * as liveCounts from "./live-counts";
import * as mediaFirst from "./media-first";
import * as mediaStates from "./media-states";
import * as sizes from "./sizes";
import * as vote from "./vote";

/** Key order is the gallery's reading order — the four shapes, the counts, then the body, the axis and the media's edge cases. */
export const postDemos = defineDemoGroup("post", {
	"feed-card": feedCard,
	vote,
	"compact-timeline": compactTimeline,
	"media-first": mediaFirst,
	"live-counts": liveCounts,
	"hashtags-and-mentions": hashtagsAndMentions,
	"expandable-body": expandableBody,
	sizes,
	"media-states": mediaStates,
});
