import { defineDemoGroup } from "../define-demo-group";
import * as custom from "./custom";
import * as persistent from "./persistent";
import * as placement from "./placement";
import * as promise from "./promise";
import * as stacking from "./stacking";
import * as statuses from "./statuses";
import * as withAction from "./with-action";

/** Key order is the gallery's reading order — what a toast says, what it offers, where it goes, then how it behaves. */
export const toastDemos = defineDemoGroup("toast", {
	statuses,
	"with-action": withAction,
	placement,
	promise,
	stacking,
	persistent,
	custom,
});
