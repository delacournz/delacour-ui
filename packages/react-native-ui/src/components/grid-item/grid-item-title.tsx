import type { ReactElement } from "react";
import { Text } from "../text";
import { useGridItemLabelPart, useGridItemPart } from "./grid-item.context";
import type { GridItemTextProps } from "./grid-item.types";
import { gridItemVariants } from "./grid-item.variants";

/**
 * The tile's label, on one line.
 *
 * Carries its own colour and scale, read from the tile's size — a React Native
 * `View` does not cascade colour to a `Text`. Its text joins the tile's
 * accessibility label, first.
 */
export function GridItemTitle({ className, children, ...props }: GridItemTextProps): ReactElement {
	const { size, registerLabel } = useGridItemPart("GridItem.Title");
	useGridItemLabelPart(registerLabel, "title", children);
	return (
		<Text className={gridItemVariants({ size }).title({ className })} numberOfLines={1} {...props}>
			{children}
		</Text>
	);
}
GridItemTitle.displayName = "DelacourUI.GridItem.Title";
