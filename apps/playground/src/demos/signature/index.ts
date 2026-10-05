import { defineDemoGroup } from "../define-demo-group";
import * as alternative from "./alternative";
import * as basic from "./basic";
import * as disabledAndReadOnly from "./disabled-and-read-only";
import * as exportSvg from "./export";
import * as inField from "./in-field";
import * as sizes from "./sizes";
import * as withToolbar from "./with-toolbar";

/** Key order is the gallery's reading order — the pad, its actions, a form, the way out, the data, then the axes. */
export const signatureDemos = defineDemoGroup("signature", {
	basic,
	"with-toolbar": withToolbar,
	"in-field": inField,
	alternative,
	export: exportSvg,
	sizes,
	"disabled-and-read-only": disabledAndReadOnly,
});
