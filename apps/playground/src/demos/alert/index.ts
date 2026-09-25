import { defineDemoGroup } from "../define-demo-group";
import * as actions from "./actions";
import * as checkout from "./checkout";
import * as configurator from "./configurator";
import * as controlled from "./controlled";
import * as customIndicator from "./custom-indicator";
import * as dismissible from "./dismissible";
import * as sizes from "./sizes";
import * as statuses from "./statuses";
import * as surfaceVariant from "./surface-variant";

/** Key order is the gallery's reading order — the axes, the configurator, dismissal, composition, then an alert in use. */
export const alertDemos = defineDemoGroup("alert", {
	statuses,
	"surface-variant": surfaceVariant,
	sizes,
	configurator,
	dismissible,
	controlled,
	actions,
	"custom-indicator": customIndicator,
	checkout,
});
