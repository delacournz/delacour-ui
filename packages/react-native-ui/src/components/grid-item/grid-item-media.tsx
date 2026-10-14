import { type ReactElement, useMemo } from "react";
import { View } from "react-native";
import { IconDefaultsProvider } from "../icon";
import { useGridItemPart } from "./grid-item.context";
import type { GridItemSlotProps } from "./grid-item.types";
import { GRID_ITEM_MEDIA_ICON_TOKEN, gridItemVariants } from "./grid-item.variants";

/**
 * The leading icon, thumbnail or avatar, above the title.
 *
 * Its subtree inherits an icon size from the tile's size and the foreground
 * token, so a bare `<Icon icon={IconWifi} />` comes out right with nothing said
 * at the call site.
 */
export function GridItemMedia({ className, children, ...props }: GridItemSlotProps): ReactElement {
	const { size } = useGridItemPart("GridItem.Media");
	const slots = gridItemVariants({ size });
	const iconClassName = slots.mediaIcon();
	const iconDefaults = useMemo(
		() => ({ className: iconClassName, color: GRID_ITEM_MEDIA_ICON_TOKEN }),
		[iconClassName]
	);

	return (
		<View className={slots.media({ className })} {...props}>
			<IconDefaultsProvider value={iconDefaults}>{children}</IconDefaultsProvider>
		</View>
	);
}
GridItemMedia.displayName = "DelacourUI.GridItem.Media";
