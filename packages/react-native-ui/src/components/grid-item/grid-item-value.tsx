import type { ReactElement } from "react";
import { Text } from "../text";
import { useGridItemLabelPart, useGridItemPart } from "./grid-item.context";
import type { GridItemTextProps } from "./grid-item.types";
import { gridItemVariants } from "./grid-item.variants";

/**
 * The headline metric.
 *
 * Tabular figures, so a value that ticks does not jitter sideways, and one
 * line that shrinks to fit rather than wrapping — a number that wraps is no
 * longer read as one. Formatted by the caller: separators and units are locale
 * decisions. Its text joins the tile's accessibility label, after the title.
 */
export function GridItemValue({ className, children, ...props }: GridItemTextProps): ReactElement {
	const { size, registerLabel } = useGridItemPart("GridItem.Value");
	useGridItemLabelPart(registerLabel, "value", children);
	return (
		<Text adjustsFontSizeToFit className={gridItemVariants({ size }).value({ className })} numberOfLines={1} {...props}>
			{children}
		</Text>
	);
}
GridItemValue.displayName = "DelacourUI.GridItem.Value";
