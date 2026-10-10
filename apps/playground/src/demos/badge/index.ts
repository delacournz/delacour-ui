import { defineDemoGroup } from "../define-demo-group";
import * as composedIcon from "./composed-icon";
import * as counts from "./counts";
import * as dots from "./dots";
import * as pinned from "./pinned";
import * as sizes from "./sizes";
import * as statusDot from "./status-dot";
import * as variantsAndColours from "./variants-and-colours";

/** Key order is the gallery's reading order — the matrix, the size scale, what can sit inside one, then the two shapes with no label and where they pin. */
export const badgeDemos = defineDemoGroup("badge", {
	"variants-and-colours": variantsAndColours,
	sizes,
	"composed-icon": composedIcon,
	"status-dot": statusDot,
	counts,
	dots,
	pinned,
});
