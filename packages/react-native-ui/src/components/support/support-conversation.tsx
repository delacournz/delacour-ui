import type { ReactElement } from "react";
import { View } from "react-native";
import { Badge } from "../badge";
import { Item, type ItemProps } from "../item";
import { Text } from "../text";
import type { SupportTicketStatus } from "./support.types";
import { resolveConversationA11yLabel, resolveConversationDot, resolveTicketStatus } from "./support.utils";
import { SUPPORT_TICKET_BADGE_VARIANT, supportVariants } from "./support.variants";

export type SupportConversationProps = Omit<ItemProps, "asChild" | "children" | "isSelected" | "orientation"> & {
	title: string;
	preview?: string;
	status: SupportTicketStatus;
	/** The request's reference — `"#4821"`. */
	reference?: string;
	/** Caller wording: `"2h"`, `"Yesterday"`. Support never formats time. */
	timestamp?: string;
	/** A reply nobody has read — the accent dot. */
	unread?: boolean;
	/** The thread moved but there is nothing new to read — the grey dot. `unread` wins when both are set. */
	updated?: boolean;
	className?: string;
};

/**
 * One past request, as a row in `Support.Conversations`: a dot, the title, two lines of the last
 * message, when, and a soft status badge.
 *
 * Two dots, two colours — an unread reply is the accent, a thread that merely moved is grey — and
 * the dot slot keeps its width when there is none, so every title starts on the same line. The
 * dots never speak: `resolveConversationA11yLabel` reads the whole row as one sentence, status and
 * dot included.
 */
export function SupportConversation({
	title,
	preview,
	status,
	reference,
	timestamp,
	unread,
	updated,
	accessibilityLabel,
	...props
}: SupportConversationProps): ReactElement {
	const dot = resolveConversationDot({ unread, updated });
	const ticket = resolveTicketStatus(status);
	const slots = supportVariants({ dot });
	const meta = [reference, timestamp].filter(Boolean).join(" · ");

	return (
		<Item
			accessibilityLabel={
				accessibilityLabel ?? resolveConversationA11yLabel({ title, reference, status, dot, timestamp, preview })
			}
			accessible
			{...props}
		>
			<View className={slots.conversationDot()} importantForAccessibility="no-hide-descendants" />
			<Item.Content>
				<Item.Title className={slots.conversationTitle()} numberOfLines={1}>
					{title}
				</Item.Title>
				{preview ? <Item.Description numberOfLines={2}>{preview}</Item.Description> : null}
			</Item.Content>
			<View className={slots.rowMeta()}>
				{meta ? <Text className={slots.rowDetail()}>{meta}</Text> : null}
				<Badge color={ticket.color} size="sm" variant={SUPPORT_TICKET_BADGE_VARIANT}>
					{ticket.label}
				</Badge>
			</View>
		</Item>
	);
}
SupportConversation.displayName = "DelacourUI.Support.Conversation";
