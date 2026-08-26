import { defineDemoGroup } from "../define-demo-group";
import * as bothIconsEveryVariant from "./both-icons-every-variant";
import * as compoundParts from "./compound-parts";
import * as disabled from "./disabled";
import * as endIcon from "./end-icon";
import * as feedback from "./feedback";
import * as haptics from "./haptics";
import * as iconOnly from "./icon-only";
import * as loadingAndDimming from "./loading-and-dimming";
import * as loadingEverySize from "./loading-every-size";
import * as loadingEveryVariant from "./loading-every-variant";
import * as loadingInARow from "./loading-in-a-row";
import * as loadingReplacesTheIcon from "./loading-replaces-the-icon";
import * as scrollCheck from "./scroll-check";
import * as sizes from "./sizes";
import * as spinnerOverridesTheButton from "./spinner-overrides-the-button";
import * as spinnerPlacement from "./spinner-placement";
import * as startIcon from "./start-icon";
import * as variants from "./variants";

/** Key order is the gallery's reading order — the matrix first, then icons, then loading, then the edge cases. */
export const buttonDemos = defineDemoGroup("button", {
	variants,
	sizes,
	"start-icon": startIcon,
	"end-icon": endIcon,
	"both-icons-every-variant": bothIconsEveryVariant,
	"icon-only": iconOnly,
	disabled,
	feedback,
	haptics,
	"loading-every-variant": loadingEveryVariant,
	"loading-replaces-the-icon": loadingReplacesTheIcon,
	"loading-every-size": loadingEverySize,
	"spinner-placement": spinnerPlacement,
	"loading-and-dimming": loadingAndDimming,
	"loading-in-a-row": loadingInARow,
	"spinner-overrides-the-button": spinnerOverridesTheButton,
	"compound-parts": compoundParts,
	"scroll-check": scrollCheck,
});
