import { Children, type ReactElement } from "react";
import { View } from "react-native";
import { IconChevronRight } from "../../icons/central";
import { Icon } from "../icon";
import { useListGroupPart } from "./list-group.context";
import type { ListGroupSlotProps } from "./list-group.types";
import {
	LIST_GROUP_SUFFIX_ICON_SIZE,
	LIST_GROUP_SUFFIX_ICON_TOKEN,
	listGroupItemSuffixVariants,
} from "./list-group.variants";

export type ListGroupIconProps = {
	/** Edge length in points. Defaults to the list group's suffix icon size. */
	size?: number;
	/** A theme colour token or a literal. Defaults to `muted-foreground`. */
	color?: string;
};

export type ListGroupItemSuffixProps = ListGroupSlotProps & {
	/** Tunes the default chevron. Ignored once the suffix has children of its own. */
	iconProps?: ListGroupIconProps;
};

/**
 * The trailing slot of a row, showing a chevron unless given content.
 *
 * The chevron is a hint that the row leads somewhere, so it sits on the muted
 * token and a step below the leading icon rather than competing with either.
 */
export function ListGroupItemSuffix({
	className,
	iconProps,
	children,
	...props
}: ListGroupItemSuffixProps): ReactElement {
	const { size } = useListGroupPart("ListGroup.ItemSuffix");
	const hasContent = Children.toArray(children).length > 0;

	return (
		<View className={listGroupItemSuffixVariants({ className })} {...props}>
			{hasContent ? (
				children
			) : (
				<Icon
					color={iconProps?.color ?? LIST_GROUP_SUFFIX_ICON_TOKEN}
					icon={IconChevronRight}
					size={iconProps?.size ?? LIST_GROUP_SUFFIX_ICON_SIZE[size]}
				/>
			)}
		</View>
	);
}
