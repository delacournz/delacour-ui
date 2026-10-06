import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import { formatUnreadDividerLabel } from "./message-scroller.utils";
import { messageScrollerVariants } from "./message-scroller.variants";

export type MessageScrollerUnreadDividerProps = {
	/** Messages from the divider to the end. */
	count: number;
	/** Replaces the default "N new messages". */
	label?: string;
	className?: string;
	testID?: string;
};

/**
 * The rule above the first unread message. A header to assistive technology, like a date
 * separator, so a reader can jump straight to it.
 */
export function MessageScrollerUnreadDivider({
	count,
	label,
	className,
	testID,
}: MessageScrollerUnreadDividerProps): ReactElement {
	const slots = messageScrollerVariants();
	const text = label ?? formatUnreadDividerLabel(count);
	return (
		<View
			accessibilityLabel={text}
			accessibilityRole="header"
			accessible
			className={cn(slots.unreadDivider(), className)}
			testID={testID}
		>
			<View className={slots.unreadRule()} />
			<Text className={slots.unreadLabel()}>{text}</Text>
			<View className={slots.unreadRule()} />
		</View>
	);
}
MessageScrollerUnreadDivider.displayName = "DelacourUI.MessageScroller.UnreadDivider";
