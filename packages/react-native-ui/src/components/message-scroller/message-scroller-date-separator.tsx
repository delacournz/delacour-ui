import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import { messageScrollerVariants } from "./message-scroller.variants";

export type MessageScrollerDateSeparatorProps = {
	/** The day, already formatted — `Today`, `Yesterday`, `Monday`, `12 Sep`. */
	label: string;
	className?: string;
	testID?: string;
};

/**
 * A day's label between two hairlines. A header to assistive technology, so a screen reader's
 * heading navigation walks the conversation a day at a time; the rules are hidden from it.
 *
 * The list draws one at each new calendar day. Exported for an app drawing its own rows.
 */
export function MessageScrollerDateSeparator({
	label,
	className,
	testID,
}: MessageScrollerDateSeparatorProps): ReactElement {
	const slots = messageScrollerVariants();
	return (
		<View
			accessibilityLabel={label}
			accessibilityRole="header"
			accessible
			className={cn(slots.dateSeparator(), className)}
			testID={testID}
		>
			<View className={slots.dateRule()} />
			<Text className={slots.dateLabel()}>{label}</Text>
			<View className={slots.dateRule()} />
		</View>
	);
}
MessageScrollerDateSeparator.displayName = "DelacourUI.MessageScroller.DateSeparator";
