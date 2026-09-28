import { SectionList } from "react-native";
import Animated from "react-native-reanimated";
import { SCROLLABLE_TYPE } from "../core";
import { createBottomSheetScrollable } from "./create-bottom-sheet-scrollable";
import type { BottomSheetSectionListComponent } from "./scrollable.types";

/**
 * Reanimated ships no `Animated.SectionList`, so this is the one built-in
 * that calls `createAnimatedComponent` — once, here, at module scope, never
 * inside a render.
 */
const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

/**
 * A `SectionList` as the sheet's body; the cast restores `<ItemT, SectionT>`
 * so `sections` and `renderItem` check against each other.
 */
export const BottomSheetSectionList = createBottomSheetScrollable(
	AnimatedSectionList,
	SCROLLABLE_TYPE.SECTION_LIST
) as unknown as BottomSheetSectionListComponent;
BottomSheetSectionList.displayName = "DelacourBottomSheet.BottomSheet.SectionList";
