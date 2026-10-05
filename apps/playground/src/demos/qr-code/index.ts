import { defineDemoGroup } from "../define-demo-group";
import * as anatomy from "./anatomy";
import * as colours from "./colours";
import * as darkTheme from "./dark-theme";
import * as errorCorrection from "./error-correction";
import * as moduleStyles from "./module-styles";
import * as sizes from "./sizes";
import * as tooLong from "./too-long";
import * as wifiShare from "./wifi-share";
import * as withLogo from "./with-logo";

/** Key order is the gallery's reading order — the code, its styles, a logo, the level, colour, size, then uses and edge cases. */
export const qrCodeDemos = defineDemoGroup("qr-code", {
	anatomy,
	"module-styles": moduleStyles,
	"with-logo": withLogo,
	"error-correction": errorCorrection,
	colours,
	sizes,
	"wifi-share": wifiShare,
	"too-long": tooLong,
	"dark-theme": darkTheme,
});
