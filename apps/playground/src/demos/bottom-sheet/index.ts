import { concatDemoGroups } from "../define-demo-group";
import { bottomSheetAnatomyDemos } from "./anatomy";
import { bottomSheetFooterDemos } from "./footer";
import { bottomSheetFormDemos } from "./form";
import { bottomSheetScrollingDemos } from "./scrolling";
import { bottomSheetSizingDemos } from "./sizing";

/** Facet order is the order `src/app/(components)/bottom-sheet/index.tsx` lists them. */
export const bottomSheetDemos = concatDemoGroups(
	bottomSheetAnatomyDemos,
	bottomSheetSizingDemos,
	bottomSheetScrollingDemos,
	bottomSheetFooterDemos,
	bottomSheetFormDemos
);
