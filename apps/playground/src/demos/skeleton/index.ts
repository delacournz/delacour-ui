import { defineDemoGroup } from "../define-demo-group";
import * as animations from "./animations";
import * as feedPost from "./feed-post";
import * as group from "./group";
import * as lines from "./lines";
import * as profileCard from "./profile-card";
import * as shapes from "./shapes";

/** Key order is the gallery's reading order — the loading swap, the shapes and motion, then composition. */
export const skeletonDemos = defineDemoGroup("skeleton", {
	"profile-card": profileCard,
	shapes,
	animations,
	lines,
	group,
	"feed-post": feedPost,
});
