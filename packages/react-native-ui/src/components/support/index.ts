export { Support, type SupportProps } from "./support";
export {
	type SupportContextValue,
	SupportProvider,
	type SupportTopicsContextValue,
	useSupport,
	useSupportContext,
	useSupportTopics,
} from "./support.context";
export {
	SUPPORT_AVAILABILITIES,
	SUPPORT_TICKET_STATUSES,
	type SupportAvailability,
	type SupportSectionProps,
	type SupportTicketStatus,
} from "./support.types";
export {
	resolveAgentA11yLabel,
	resolveAgentStatusLine,
	resolveAvailabilityLabel,
	resolveAvailabilityWord,
	resolveConversationA11yLabel,
	resolveConversationDot,
	resolveNextTopic,
	resolveReplyA11yHint,
	resolveStatusA11yLabel,
	resolveTicketStatus,
	resolveTopicA11yLabel,
	resolveTypingOpacities,
	type SupportConversationDot,
	type SupportTicketStatusInfo,
} from "./support.utils";
export {
	resolveReplyColor,
	SUPPORT_CONVERSATION_DOTS,
	SUPPORT_NOTE_ICON_TOKEN,
	SUPPORT_TICKET_BADGE_VARIANT,
	SUPPORT_TOPIC_ICON_TOKEN,
	type SupportVariantProps,
	supportVariants,
} from "./support.variants";
export type { SupportAgentProps } from "./support-agent";
export type { SupportArticleProps } from "./support-article";
export type { SupportArticlesProps } from "./support-articles";
export type { SupportChannelProps } from "./support-channel";
export type { SupportChannelsProps } from "./support-channels";
export type { SupportConversationProps } from "./support-conversation";
export type { SupportConversationsProps } from "./support-conversations";
export type { SupportHandoffProps } from "./support-handoff";
export type { SupportHeaderProps } from "./support-header";
export type { SupportNoteProps } from "./support-note";
export type { SupportRepliesProps } from "./support-replies";
export type { SupportReplyProps } from "./support-reply";
export type { SupportResolutionProps } from "./support-resolution";
export type { SupportStatusProps } from "./support-status";
export type { SupportTicketProps } from "./support-ticket";
export type { SupportTopicProps } from "./support-topic";
export type { SupportTopicsProps } from "./support-topics";
