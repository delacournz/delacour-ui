import { concatDemoGroups } from "../define-demo-group";
import { bottomSheetAnatomyDemos } from "./anatomy";
import { bottomSheetFooterDemos } from "./footer";
import { bottomSheetFormDemos } from "./form";
import { bottomSheetHostingDemos } from "./hosting";
import { bottomSheetScrollingDemos } from "./scrolling";
import { bottomSheetSizingDemos } from "./sizing";
import { bottomSheetStepsDemos } from "./steps";

/** Facet order is the order `src/app/(components)/bottom-sheet/index.tsx` lists them. */
export const bottomSheetDemos = concatDemoGroups(
	bottomSheetAnatomyDemos,
	bottomSheetSizingDemos,
	bottomSheetScrollingDemos,
	bottomSheetFooterDemos,
	bottomSheetFormDemos,
	bottomSheetStepsDemos,
	bottomSheetHostingDemos
);
