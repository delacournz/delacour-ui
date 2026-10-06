import { defineDemoGroup } from "../define-demo-group";
import * as blurBar from "./blur-bar";
import * as cover from "./cover";
import * as earlyHandover from "./early-handover";
import * as largeTitleList from "./large-title-list";
import * as noLarge from "./no-large";
import * as reactToCollapse from "./react-to-collapse";

/** Key order is the gallery's reading order — the common screen, a cover, the blur bar, then the knobs. */
export const scrollHeaderDemos = defineDemoGroup("scroll-header", {
	"large-title-list": largeTitleList,
	cover,
	"blur-bar": blurBar,
	"early-handover": earlyHandover,
	"react-to-collapse": reactToCollapse,
	"no-large": noLarge,
});
