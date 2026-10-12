import { defineDemoGroup } from "../define-demo-group";
import * as cards from "./cards";
import * as compact from "./compact";
import * as horizontal from "./horizontal";
import * as icons from "./icons";
import * as longList from "./long-list";
import * as mastheadStats from "./masthead-stats";
import * as numbered from "./numbered";
import * as orderHistory from "./order-history";
import * as tones from "./tones";
import * as withAside from "./with-aside";

/** Key order is the gallery's reading order — progress, then kind, the variants, the side parts, then the strip and the long list. */
export const timelineDemos = defineDemoGroup("timeline", {
	"order-history": orderHistory,
	tones,
	numbered,
	icons,
	cards,
	compact,
	"with-aside": withAside,
	"masthead-stats": mastheadStats,
	horizontal,
	"long-list": longList,
});
