import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { type AccessibilityActionEvent, AccessibilityInfo, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { type MessageContextValue, MessageProvider } from "./message.context";
import type { MessageStatus } from "./message.types";
import {
	type MessageLabelPart,
	resolveMessageAccessibilityActions,
	resolveMessageAccessibilityLabel,
	resolveMessageChildSlot,
	resolveMessageLabelParts,
	resolveMessageStatusLabel,
	shouldAnnounceStatusChange,
} from "./message.utils";
import {
	type MessageDirection,
	type MessagePosition,
	type MessageSize,
	type MessageTone,
	messageVariants,
} from "./message.variants";
import { MessageActions } from "./message-actions";
import { MessageAttachments } from "./message-attachments";
import { MessageAuthor } from "./message-author";
import { MessageAvatar } from "./message-avatar";
import { MessageBubble } from "./message-bubble";
import { MessageHeader } from "./message-header";
import { MessageReactions } from "./message-reactions";
import { MessageStatusRow } from "./message-status";
import { MessageText } from "./message-text";
import { MessageTimestamp } from "./message-timestamp";
import { MessageTyping } from "./message-typing";

const ENTERING = FadeInDown.duration(160);

export type MessageProps = {
	/** Which side the message is on. Alignment and fill follow it. */
	direction: MessageDirection;
	/**
	 * Where it sits in a run of messages from one sender — computed by the list
	 * from its neighbours, never by the message. Default `single`.
	 */
	position?: MessagePosition;
	/** The delivery receipt. Outgoing only; ignored on an incoming message. */
	status?: MessageStatus;
	/** `accent` fills an incoming bubble with `secondary`; `plain` drops the fill — emoji-only and system lines. */
	tone?: MessageTone;
	/** The text step, with the bubble's padding following it. Default `md`. */
	size?: MessageSize;
	/** Highlights the row and outlines the bubble — the seam for a long-press menu the app hosts. */
	isSelected?: boolean;
	/**
	 * Fades the message in as it mounts. Pass it only for a message that arrived
	 * after the list's first layout; history, and a recycled cell, must not animate.
	 * Off under reduce motion.
	 */
	animateEntrance?: boolean;
	/**
	 * Leaves the parts as separate accessibility elements instead of merging them
	 * into one — for a message holding a control of its own, such as a link or a
	 * pressable attachment. The message's own press actions are then the app's to expose.
	 */
	isCompound?: boolean;
	onPress?: () => void;
	onLongPress?: () => void;
	/** Shown as a Retry control beside a `failed` receipt, and offered as an accessibility action. */
	onRetry?: () => void;
	/** Replaces the label composed from the parts. */
	accessibilityLabel?: string;
	className?: string;
	children: ReactNode;
};

function MessageRoot({
	direction,
	position = "single",
	status: statusProp,
	tone = "default",
	size = "md",
	isSelected = false,
	animateEntrance = false,
	isCompound = false,
	onPress,
	onLongPress,
	onRetry,
	accessibilityLabel,
	className,
	children,
}: MessageProps): ReactElement {
	const isCalm = useCalmMotion();
	const isOutgoing = direction === "outgoing";
	const status = isOutgoing ? statusProp : undefined;
	const [labelParts, setLabelParts] = useState<ReadonlyMap<string, MessageLabelPart>>(() => new Map());

	const reportLabelPart = useCallback((id: string, part: MessageLabelPart | undefined) => {
		setLabelParts((current) => {
			const existing = current.get(id);
			if (part === undefined ? existing === undefined : isSamePart(existing, part)) return current;
			const next = new Map(current);
			if (part === undefined) next.delete(id);
			else next.set(id, part);
			return next;
		});
	}, []);

	const context = useMemo<MessageContextValue>(
		() => ({
			direction,
			isCompound,
			isInteractive: onPress !== undefined || onLongPress !== undefined,
			isOutgoing,
			isSelected,
			onLongPress,
			onPress,
			onRetry,
			position,
			reportLabelPart,
			size,
			status,
			tone,
		}),
		[
			direction,
			isCompound,
			isOutgoing,
			isSelected,
			onLongPress,
			onPress,
			onRetry,
			position,
			reportLabelPart,
			size,
			status,
			tone,
		]
	);

	const previousStatus = useRef<MessageStatus | undefined>(status);
	useEffect(() => {
		const previous = previousStatus.current;
		previousStatus.current = status;
		if (status && shouldAnnounceStatusChange(previous, status)) {
			AccessibilityInfo.announceForAccessibility(resolveMessageStatusLabel(status));
		}
	}, [status]);

	const parts = resolveMessageLabelParts([...labelParts.values()]);
	const label =
		accessibilityLabel ??
		resolveMessageAccessibilityLabel({
			author: parts.author,
			direction,
			isTyping: parts.isTyping,
			position,
			status,
			statusLabel: parts.statusLabel,
			text: parts.text,
			time: parts.time,
		});
	const actions = resolveMessageAccessibilityActions({
		hasLongPress: onLongPress !== undefined,
		hasPress: onPress !== undefined,
		hasRetry: onRetry !== undefined && status?.type === "failed",
	});

	const onAccessibilityAction = (event: AccessibilityActionEvent) =>
		runMessageAccessibilityAction(event.nativeEvent.actionName, { onLongPress, onPress, onRetry });

	const { column, gutter } = partitionMessageChildren(children);

	const slots = messageVariants({ direction, isSelected, position });
	const entering = animateEntrance && !isCalm ? ENTERING : undefined;
	const accessibility = isCompound
		? { accessible: false }
		: {
				accessibilityActions: actions.length > 0 ? actions : undefined,
				accessibilityLabel: label || undefined,
				accessibilityRole: onPress ? ("button" as const) : ("text" as const),
				accessibilityState: { selected: isSelected },
				accessible: true,
				onAccessibilityAction,
			};

	return (
		<MessageProvider value={context}>
			<Animated.View className={slots.root({ className })} entering={entering} {...accessibility}>
				{isOutgoing ? null : gutter}
				<View className={slots.column()}>{column}</View>
			</Animated.View>
		</MessageProvider>
	);
}

function runMessageAccessibilityAction(
	name: string,
	handlers: Pick<MessageProps, "onPress" | "onLongPress" | "onRetry">
): void {
	if (name === "activate") handlers.onPress?.();
	else if (name === "longpress" || name === "more") handlers.onLongPress?.();
	else if (name === "retry") handlers.onRetry?.();
}

/** Splits the root's children into the avatar gutter and the stacked column. */
function partitionMessageChildren(children: ReactNode): { gutter: ReactNode[]; column: ReactNode[] } {
	const gutter: ReactNode[] = [];
	const column: ReactNode[] = [];
	for (const child of Children.toArray(children)) {
		const slot = isValidElement(child) ? resolveMessageChildSlot(readDisplayName(child.type)) : "column";
		(slot === "gutter" ? gutter : column).push(child);
	}
	return { column, gutter };
}

function isSamePart(a: MessageLabelPart | undefined, b: MessageLabelPart): boolean {
	if (a === undefined || a.kind !== b.kind) return false;
	return a.kind === "typing" || (b.kind !== "typing" && a.value === b.value);
}

function readDisplayName(type: unknown): string | undefined {
	if ((typeof type === "function" || typeof type === "object") && type !== null && "displayName" in type) {
		const name = (type as { displayName?: unknown }).displayName;
		return typeof name === "string" ? name : undefined;
	}
	return undefined;
}

/**
 * One chat message: a bubble on the incoming or outgoing side, with an avatar
 * gutter, author and timestamp, content, delivery receipt, reactions and actions.
 *
 * It draws one message and nothing about the list around it. Where it sits in a
 * run of one sender's messages is `position`, which the list computes from the
 * neighbours; the corners and the gap below follow it, so the run reads as one
 * stack with no separator logic in the list.
 *
 * The whole message is one accessibility element, read as
 * "Kate, 9:41 AM, Are we still on for tonight?" — each part reports its words
 * and the root composes them. `isCompound` opts out, for a message holding a
 * control of its own.
 *
 * Avatars, attachments and reaction chips are passed in as children; Message
 * imports none of them.
 *
 * @example
 * <Message direction="incoming" position="last">
 *   <Message.Avatar>
 *     <Avatar size="sm"><Avatar.Fallback>KM</Avatar.Fallback></Avatar>
 *   </Message.Avatar>
 *   <Message.Header>
 *     <Message.Author>Kate</Message.Author>
 *     <Message.Timestamp date={sentAt} />
 *   </Message.Header>
 *   <Message.Bubble>
 *     <Message.Text>Are we still on for tonight?</Message.Text>
 *   </Message.Bubble>
 * </Message>
 *
 * @example
 * <Message direction="outgoing" status={{ type: "failed" }} onRetry={resend}>
 *   <Message.Bubble>
 *     <Message.Text>On my way</Message.Text>
 *   </Message.Bubble>
 *   <Message.Status />
 * </Message>
 */
export const Message = Object.assign(MessageRoot, {
	/** The gutter beside an incoming run: its children beside the last bubble, an equal-width spacer elsewhere. */
	Avatar: MessageAvatar,
	/** A row above the bubble, for the author and the timestamp. */
	Header: MessageHeader,
	/** The sender's name, reported to the spoken label. */
	Author: MessageAuthor,
	/** The fill, padding and run-aware corners. Pressable when the message has a handler. */
	Bubble: MessageBubble,
	/** Body text on the bubble's foreground, reported to the spoken label. */
	Text: MessageText,
	/** A clipped stack for media and attachment tiles, inside or under the bubble. */
	Attachments: MessageAttachments,
	/** When the message was sent, formatted the way a chat list shows it. */
	Timestamp: MessageTimestamp,
	/** The delivery receipt, under the last outgoing bubble of a run, with Retry when it failed. */
	Status: MessageStatusRow,
	/** A row of reaction chips, hung over the bubble's edge or below it. */
	Reactions: MessageReactions,
	/** A row of controls under the bubble — reply, retry, anything. */
	Actions: MessageActions,
	/** Three pulsing dots in a bubble, in place of `Message.Bubble`. */
	Typing: MessageTyping,
	displayName: "DelacourUI.Message",
});
