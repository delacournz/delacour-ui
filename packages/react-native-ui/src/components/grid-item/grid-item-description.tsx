import type { ReactElement } from "react";
import { Text } from "../text";
import { useGridItemLabelPart, useGridItemPart } from "./grid-item.context";
import type { GridItemTextProps } from "./grid-item.types";
import { gridItemVariants } from "./grid-item.variants";

/**
 * One muted line under the value — a unit, a total, a status.
 *
 * Its text joins the tile's accessibility label, last.
 */
export function GridItemDescription({ className, children, ...props }: GridItemTextProps): ReactElement {
	const { size, registerLabel } = useGridItemPart("GridItem.Description");
	useGridItemLabelPart(registerLabel, "description", children);
	return (
		<Text className={gridItemVariants({ size }).description({ className })} numberOfLines={1} {...props}>
			{children}
		</Text>
	);
}
GridItemDescription.displayName = "DelacourUI.GridItem.Description";
