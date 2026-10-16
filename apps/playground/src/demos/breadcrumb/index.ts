import { defineDemoGroup } from "../define-demo-group";
import * as basic from "./basic";
import * as collapsed from "./collapsed";
import * as customSeparator from "./custom-separator";
import * as ellipsisSheet from "./ellipsis-sheet";
import * as scrollOverflow from "./scroll-overflow";
import * as sizes from "./sizes";

/** Key order is the gallery's reading order — the trail, its axes, then the three ways a long one fits. */
export const breadcrumbDemos = defineDemoGroup("breadcrumb", {
	basic,
	sizes,
	"custom-separator": customSeparator,
	collapsed,
	"ellipsis-sheet": ellipsisSheet,
	"scroll-overflow": scrollOverflow,
});
