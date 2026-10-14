import { type ReactElement, useMemo } from "react";
import { View } from "react-native";
import { IconDefaultsProvider } from "../icon";
import { useGridItemPart } from "./grid-item.context";
import type { GridItemSlotProps } from "./grid-item.types";
import { GRID_ITEM_ACTIONS_ICON_TOKEN, gridItemVariants } from "./grid-item.variants";

/**
 * Controls pinned to the tile's top-end corner — an overflow button, a toggle,
 * a status glyph.
 *
 * Positioned on the logical `end` inset at the tile's own padding, so it
 * mirrors under right-to-left and lines up with the content's edge. A bare
 * icon inherits the muted token a step below the media's size.
 *
 * A pressable tile merges its children into one accessibility element, which
 * would swallow a control here. Put real controls on a static tile, and give
 * that tile `accessible={false}` so each control is reachable on its own.
 */
export function GridItemActions({ className, children, ...props }: GridItemSlotProps): ReactElement {
	const { size } = useGridItemPart("GridItem.Actions");
	const slots = gridItemVariants({ size });
	const iconClassName = slots.actionsIcon();
	const iconDefaults = useMemo(
		() => ({ className: iconClassName, color: GRID_ITEM_ACTIONS_ICON_TOKEN }),
		[iconClassName]
	);

	return (
		<View className={slots.actions({ className })} {...props}>
			<IconDefaultsProvider value={iconDefaults}>{children}</IconDefaultsProvider>
		</View>
	);
}
GridItemActions.displayName = "DelacourUI.GridItem.Actions";
