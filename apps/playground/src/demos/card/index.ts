import { defineDemoGroup } from "../define-demo-group";
import * as anatomy from "./anatomy";
import * as configurator from "./configurator";
import * as footerBand from "./footer-band";
import * as media from "./media";
import * as nesting from "./nesting";
import * as planPicker from "./plan-picker";
import * as signIn from "./sign-in";
import * as sizes from "./sizes";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the anatomy, the axes, the footer, then cards in use. */
export const cardDemos = defineDemoGroup("card", {
	anatomy,
	variants,
	sizes,
	"footer-band": footerBand,
	configurator,
	nesting,
	media,
	"plan-picker": planPicker,
	"sign-in": signIn,
});
