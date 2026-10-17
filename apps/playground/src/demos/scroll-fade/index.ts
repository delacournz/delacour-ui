import { defineDemoGroup } from "../define-demo-group";
import * as fadeDistance from "./fade-distance";
import * as horizontalCards from "./horizontal-cards";

import * as onASurface from "./on-a-surface";
import * as singleEdge from "./single-edge";
import * as throughAProvider from "./through-a-provider";
import * as verticalList from "./vertical-list";

/** Key order is the gallery's reading order — the two axes, one edge, the colour, a provider with no prop, then the tuning. */
export const scrollFadeDemos = defineDemoGroup("scroll-fade", {
	"vertical-list": verticalList,
	"horizontal-cards": horizontalCards,
	"single-edge": singleEdge,
	"on-a-surface": onASurface,
	"through-a-provider": throughAProvider,
	"fade-distance": fadeDistance,
});
