import Animated from "react-native-reanimated";
import { SCROLLABLE_TYPE } from "../core";
import { createBottomSheetScrollable } from "./create-bottom-sheet-scrollable";
import type { BottomSheetFlatListComponent } from "./scrollable.types";

/**
 * A `FlatList` as the sheet's body. `Animated.FlatList` is Reanimated's own,
 * made once at module scope; the cast restores `<ItemT>` so `data` and
 * `renderItem` check against each other.
 */
export const BottomSheetFlatList = createBottomSheetScrollable(
	Animated.FlatList,
	SCROLLABLE_TYPE.FLAT_LIST
) as unknown as BottomSheetFlatListComponent;
BottomSheetFlatList.displayName = "DelacourBottomSheet.BottomSheet.FlatList";
