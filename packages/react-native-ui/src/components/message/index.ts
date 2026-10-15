export { Message, type MessageProps } from "./message";
export { type MessageContextValue, MessageProvider, useMessage, useMessageContext } from "./message.context";
export type { MessageSlotProps, MessageStatus, MessageStatusType } from "./message.types";
export {
	extractMessageText,
	formatMessageTime,
	isEmojiOnly,
	type MessageAccessibilityAction,
	type MessageAccessibilityLabelInput,
	type MessageLabelPart,
	resolveMessageAccessibilityActions,
	resolveMessageAccessibilityLabel,
	resolveMessageStatusLabel,
	shouldAnnounceStatusChange,
	shouldShowAvatar,
	shouldShowStatus,
} from "./message.utils";
export {
	MESSAGE_DIRECTIONS,
	MESSAGE_FILL_FOREGROUND,
	MESSAGE_POSITIONS,
	MESSAGE_REACTION_PLACEMENTS,
	MESSAGE_SIZES,
	MESSAGE_STATUS_TOKEN,
	MESSAGE_STATUS_TYPES,
	MESSAGE_TONES,
	type MessageCornerStep,
	type MessageCorners,
	type MessageDirection,
	type MessagePosition,
	type MessageReactionPlacement,
	type MessageSize,
	type MessageTone,
	type MessageVariantProps,
	messageVariants,
	resolveMessageCornerClass,
	resolveMessageCorners,
	resolveMessageSpacing,
} from "./message.variants";
export type { MessageAuthorProps } from "./message-author";
export type { MessageBubbleProps } from "./message-bubble";
export type { MessageReactionsProps } from "./message-reactions";
export type { MessageStatusProps } from "./message-status";
export type { MessageTextProps } from "./message-text";
export type { MessageTimestampProps } from "./message-timestamp";
export type { MessageTypingProps } from "./message-typing";
