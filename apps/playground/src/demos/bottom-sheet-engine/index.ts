import { concatDemoGroups } from "../define-demo-group";
import { bottomSheetEngineAnatomyDemos } from "./anatomy";
import { bottomSheetEngineDetachedDemos } from "./detached";
import { bottomSheetEngineFooterDemos } from "./footer";
import { bottomSheetEngineKeyboardDemos } from "./keyboard";
import { bottomSheetEnginePortalDemos } from "./portal";
import { bottomSheetEngineScrollablesDemos } from "./scrollables";
import { bottomSheetEngineStepsDemos } from "./steps";

/**
 * The engine, `@delacour/react-native-bottom-sheet`, rendered on its own.
 *
 * Keyed `bottom-sheet-engine` rather than `bottom-sheet` on purpose:
 * `bottom-sheet/` is the themed library's component and these demos import
 * nothing from it. The other facets — detents, gestures, keyboard, footer,
 * scrollables, portal, detached, steps — arrive with BSHEET-8.
 */
export const bottomSheetEngineDemos = concatDemoGroups(
	bottomSheetEngineAnatomyDemos,
	bottomSheetEngineKeyboardDemos,
	bottomSheetEngineFooterDemos,
	bottomSheetEngineScrollablesDemos,
	bottomSheetEnginePortalDemos,
	bottomSheetEngineDetachedDemos,
	bottomSheetEngineStepsDemos
);
