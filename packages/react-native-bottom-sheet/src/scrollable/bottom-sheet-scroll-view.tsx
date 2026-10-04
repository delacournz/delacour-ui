import Animated from "react-native-reanimated";
import { SCROLLABLE_TYPE } from "../core";
import { createBottomSheetScrollable } from "./create-bottom-sheet-scrollable";
import type { BottomSheetScrollViewComponent } from "./scrollable.types";

/**
 * A `ScrollView` as the sheet's body: locked below the highest snap point, sized
 * to its content when the sheet is dynamic. `Animated.ScrollView` is
 * Reanimated's own, made once at module scope.
 */
export const BottomSheetScrollView = createBottomSheetScrollable(
	Animated.ScrollView,
	SCROLLABLE_TYPE.SCROLL_VIEW
) as unknown as BottomSheetScrollViewComponent;
BottomSheetScrollView.displayName = "DelacourBottomSheet.BottomSheet.ScrollView";
