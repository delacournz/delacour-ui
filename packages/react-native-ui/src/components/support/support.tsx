import { type ReactElement, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { type SupportContextValue, SupportProvider } from "./support.context";
import type { SupportAvailability } from "./support.types";
import { supportVariants } from "./support.variants";
import { SupportAgent } from "./support-agent";
import { SupportArticle } from "./support-article";
import { SupportArticles } from "./support-articles";
import { SupportChannel } from "./support-channel";
import { SupportChannels } from "./support-channels";
import { SupportConversation } from "./support-conversation";
import { SupportConversations } from "./support-conversations";
import { SupportHandoff } from "./support-handoff";
import { SupportHeader } from "./support-header";
import { SupportNote } from "./support-note";
import { SupportReplies } from "./support-replies";
import { SupportReply } from "./support-reply";
import { SupportResolution } from "./support-resolution";
import { SupportStatus } from "./support-status";
import { SupportTicket } from "./support-ticket";
import { SupportTopic } from "./support-topic";
import { SupportTopics } from "./support-topics";

export type SupportProps = ViewProps & {
	/**
	 * Whether anyone is there to answer. Decided once, here — `Status`, `Agent` and `Note` read it,
	 * so a screen is never half "we are here" and half "we are not". Default `offline`.
	 */
	availability?: SupportAvailability;
	className?: string;
};

function SupportRoot({ availability = "offline", className, children, ...props }: SupportProps): ReactElement {
	const context = useMemo<SupportContextValue>(() => ({ availability }), [availability]);

	return (
		<SupportProvider value={context}>
			<View className={supportVariants().root({ className })} {...props}>
				{children}
			</View>
		</SupportProvider>
	);
}

/**
 * Everything around a help conversation, not the conversation itself: who is answering, whether
 * anyone is there, the ways to reach them, what the problem is about, what happened to earlier
 * requests, and the furniture of a thread — the agent, the ticket, a handoff, suggested replies, a
 * note above the composer and the closing question.
 *
 * It never renders the transcript or the composer: those are the app's, composed between these
 * parts. Every part is optional. `availability` is set once on the root; `Agent` and `Note` also
 * work with no root at all, on a thread route, defaulting to `offline`.
 *
 * @example
 * <Support availability="online">
 *   <Support.Header title="Help" description="Questions about an order or your account." />
 *   <Support.Status replyTime="Typically replies in under an hour" />
 *   <Support.Channels title="Get in touch">
 *     <Support.Channel icon={<Icon icon={IconBubbleText} />} label="Chat" detail="~5m" onPress={openChat} />
 *     <Support.Channel icon={<Icon icon={IconEmail1} />} label="Email" detail="~1d" onPress={openEmail} />
 *   </Support.Channels>
 *   <Support.Conversations title="Your requests">
 *     <Support.Conversation title="Refund for order #4821" status="solved" timestamp="2h" unread />
 *   </Support.Conversations>
 * </Support>
 *
 * @example
 * <Support.Agent name="Khalid Abdi" title="Support" typing={isTyping} avatar={<Avatar name="Khalid Abdi" />} />
 * <Support.Handoff>You were passed to Khalid, who can see everything you told the assistant.</Support.Handoff>
 * <Support.Replies>
 *   <Support.Reply label="That fixed it" onPress={resolve} />
 *   <Support.Reply escalates label="Talk to a person" onPress={escalate} />
 * </Support.Replies>
 */
export const Support = Object.assign(SupportRoot, {
	/** The title, a line under it, and a trailing slot for the faces of the people who answer. */
	Header: SupportHeader,
	/** Whether anyone is there — a dot and a line, one live element to a screen reader. */
	Status: SupportStatus,
	/** A titled card of `Support.Channel` rows. */
	Channels: SupportChannels,
	/** One way to reach a person, with what it costs in waiting. Dimmed and announced disabled when shut. */
	Channel: SupportChannel,
	/** A single-select radio group of `Support.Topic` cards, controlled or not. */
	Topics: SupportTopics,
	/** One topic — a card row announced as a radio. */
	Topic: SupportTopic,
	/** A titled card of past requests. */
	Conversations: SupportConversations,
	/** One past request — status badge, and an unread or updated dot. */
	Conversation: SupportConversation,
	/** A titled card of help-centre pages. */
	Articles: SupportArticles,
	/** One help-centre page. */
	Article: SupportArticle,
	/** Who is answering, with a typing indicator that replaces the status line. */
	Agent: SupportAgent,
	/** The request a thread belongs to, with its status. */
	Ticket: SupportTicket,
	/** The moment a thread changes hands, between two turns. */
	Handoff: SupportHandoff,
	/** A quiet line above the composer about what happens to the next message. */
	Note: SupportNote,
	/** A sideways-scrolling row of suggested answers. */
	Replies: SupportReplies,
	/** One suggested answer; `escalates` marks the way out to a person. */
	Reply: SupportReply,
	/** The closing question, with the caller's control for the answer. */
	Resolution: SupportResolution,
	displayName: "DelacourUI.Support",
});
