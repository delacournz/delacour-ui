import type { ReactElement } from "react";
import { View } from "react-native";
import type { GridItemSlotProps } from "./grid-item.types";
import { gridItemVariants } from "./grid-item.variants";

/**
 * A full-width strip pushed to the bottom of the tile — a button, a progress
 * bar, a timestamp. Whatever the content above it, it sits on the tile's
 * bottom padding.
 */
export function GridItemFooter({ className, ...props }: GridItemSlotProps): ReactElement {
	return <View className={gridItemVariants().footer({ className })} {...props} />;
}
GridItemFooter.displayName = "DelacourUI.GridItem.Footer";
