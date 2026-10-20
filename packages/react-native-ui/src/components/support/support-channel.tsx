import type { ReactElement } from "react";
import { IconChevronRight } from "../../icons/central";
import { Icon } from "../icon";
import { Item, type ItemProps } from "../item";
import { Text } from "../text";
import { supportVariants } from "./support.variants";

export type SupportChannelProps = Omit<ItemProps, "asChild" | "children" | "isSelected" | "orientation"> & {
	/** The channel's glyph — an `<Icon>`. Composed, so it inherits the row's size and colour. */
	icon: ReactElement;
	label: string;
	description?: string;
	/** What it costs in waiting: `"~1h"`. */
	detail?: string;
	/** Real but shut — out of hours, not on this plan. Dimmed, announced disabled, still present. */
	isDisabled?: boolean;
	className?: string;
};

/**
 * One way to reach a person — chat, email, a call — as a row in `Support.Channels`.
 *
 * An `Item` with an icon tile, the channel's name and line, what it costs in waiting, and a
 * chevron. A shut channel stays on the screen, dimmed and announced disabled, rather than
 * disappearing: a reader who knows the phone line exists and finds it gone assumes the app is
 * broken. The app opens the channel in `onPress` — this never calls `Linking` itself.
 */
export function SupportChannel({
	icon,
	label,
	description,
	detail,
	isDisabled = false,
	...props
}: SupportChannelProps): ReactElement {
	const slots = supportVariants();

	return (
		<Item isDisabled={isDisabled} {...props}>
			<Item.Media variant="icon">{icon}</Item.Media>
			<Item.Content>
				<Item.Title numberOfLines={1}>{label}</Item.Title>
				{description ? <Item.Description numberOfLines={2}>{description}</Item.Description> : null}
			</Item.Content>
			<Item.Actions>
				{detail ? <Text className={slots.rowDetail()}>{detail}</Text> : null}
				<Icon icon={IconChevronRight} />
			</Item.Actions>
		</Item>
	);
}
SupportChannel.displayName = "DelacourUI.Support.Channel";
