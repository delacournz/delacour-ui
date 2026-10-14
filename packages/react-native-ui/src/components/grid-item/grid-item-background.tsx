import type { ReactElement } from "react";
import { View } from "react-native";
import type { GridItemSlotProps } from "./grid-item.types";
import { gridItemVariants } from "./grid-item.variants";

/**
 * Fills the whole tile behind its content — a gradient, a chart, an oversized
 * glyph, an image.
 *
 * The tile draws it first wherever it sits among the children, so it is always
 * behind, and clips it to its corner. It takes no touches, so a pressable tile
 * stays pressable across its whole face; give it `pointerEvents="auto"` for a
 * background that is itself interactive.
 */
export function GridItemBackground({ className, ...props }: GridItemSlotProps): ReactElement {
	return (
		<View
			accessibilityElementsHidden
			className={gridItemVariants().background({ className })}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			{...props}
		/>
	);
}
GridItemBackground.displayName = "DelacourUI.GridItem.Background";
