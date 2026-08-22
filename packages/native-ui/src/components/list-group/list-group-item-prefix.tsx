import { type ReactElement, useMemo } from "react";
import { View } from "react-native";
import { IconDefaultsProvider } from "../icon";
import { useListGroupPart } from "./list-group.context";
import type { ListGroupSlotProps } from "./list-group.types";
import { LIST_GROUP_FOREGROUND_TOKEN, LIST_GROUP_ICON_SIZE, listGroupItemPrefixVariants } from "./list-group.variants";

/**
 * The leading slot of a row.
 *
 * Its subtree inherits the list group's icon size and the foreground token, so a
 * bare `<Icon icon={IconWifi} />` comes out right with nothing said at the call
 * site — the same cascade a `Button` gives its icons.
 */
export function ListGroupItemPrefix({ className, children, ...props }: ListGroupSlotProps): ReactElement {
	const { size } = useListGroupPart("ListGroup.ItemPrefix");
	const iconDefaults = useMemo(
		() => ({ color: LIST_GROUP_FOREGROUND_TOKEN, size: LIST_GROUP_ICON_SIZE[size] }),
		[size]
	);

	return (
		<View className={listGroupItemPrefixVariants({ className })} {...props}>
			<IconDefaultsProvider value={iconDefaults}>{children}</IconDefaultsProvider>
		</View>
	);
}
