import { defineDemoGroup } from "../define-demo-group";
import * as composedIcon from "./composed-icon";
import * as dismissible from "./dismissible";
import * as etched from "./etched";
import * as sizes from "./sizes";
import * as statusDot from "./status-dot";
import * as variantsAndColours from "./variants-and-colours";

/** Key order is the gallery's reading order — the matrix, then the size scale, then what can sit inside one. */
export const badgeDemos = defineDemoGroup("badge", {
	"variants-and-colours": variantsAndColours,
	etched,
	sizes,
	"composed-icon": composedIcon,
	"status-dot": statusDot,
	dismissible,
});
