import { defineDemoGroup } from "../define-demo-group";
import * as blurVsFade from "./blur-vs-fade";
import * as fallback from "./fallback";
import * as horizontal from "./horizontal";
import * as layersAndIntensity from "./layers-and-intensity";
import * as listUnderButton from "./list-under-button";
import * as searchOverMedia from "./search-over-media";

/** Key order is the gallery's reading order — the job it does, each edge, why not a fade, then the knobs and the fallback. */
export const scrollBlurDemos = defineDemoGroup("scroll-blur", {
	"list-under-button": listUnderButton,
	"search-over-media": searchOverMedia,
	horizontal,
	"blur-vs-fade": blurVsFade,
	"layers-and-intensity": layersAndIntensity,
	fallback,
});
