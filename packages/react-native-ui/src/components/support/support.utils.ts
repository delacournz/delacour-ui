import { DELACOUR_DEFAULT_LABELS, type SupportLabels } from "../../lib/labels";
import type { BadgeColor } from "../badge/badge.variants";
import type { SupportAvailability, SupportTicketStatus } from "./support.types";

export { SUPPORT_AVAILABILITIES, SUPPORT_TICKET_STATUSES } from "./support.types";

/** Which dot a past request draws: a reply nobody has read, a thread that moved, or nothing. */
export type SupportConversationDot = "unread" | "updated" | "none";

const DEFAULT_LABELS = DELACOUR_DEFAULT_LABELS.support;

/** What a ticket status looks like and says. */
export type SupportTicketStatusInfo = {
	/** The badge's words. */
	label: string;
	/** The soft badge colour it is painted in. */
	color: Extract<BadgeColor, "info" | "warning" | "success" | "default">;
	/** The team is waiting on the reader — the one status that asks them to act. */
	needsReader: boolean;
};

const TICKET_STATUS: Record<SupportTicketStatus, Omit<SupportTicketStatusInfo, "label">> = {
	open: { color: "info", needsReader: false },
	pending: { color: "warning", needsReader: true },
	solved: { color: "success", needsReader: false },
	closed: { color: "default", needsReader: false },
};

const CALM_TYPING_OPACITIES = [1, 0.6, 0.3] as const;
const MOVING_TYPING_OPACITIES = [1, 1, 1] as const;

/** A caller's string, or `undefined` when it is missing or blank — empty is absent. */
function present(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

/** The short word for an availability — `Online`, `Away`, `Offline`. */
export function resolveAvailabilityWord(
	availability: SupportAvailability,
	labels: SupportLabels = DEFAULT_LABELS
): string {
	return labels.availability(availability);
}

/**
 * What the status line shows: the caller's wording when there is any ("Typically replies in under
 * an hour"), else the availability's own sentence ("We're online").
 */
export function resolveAvailabilityLabel(
	availability: SupportAvailability,
	replyTime?: string,
	labels: SupportLabels = DEFAULT_LABELS
): string {
	return present(replyTime) ?? labels.availabilityStatus(availability);
}

/**
 * What the status line says to a screen reader. The availability leads, because the dot that draws
 * it is decorative and colour alone must not carry it: `"Away. Back tomorrow"`.
 */
export function resolveStatusA11yLabel(
	availability: SupportAvailability,
	replyTime?: string,
	labels: SupportLabels = DEFAULT_LABELS
): string {
	const wording = present(replyTime);
	const word = labels.availability(availability);
	return wording ? labels.statusSpoken(word, wording) : word;
}

/** A ticket status's label, soft badge colour, and whether it is waiting on the reader. */
export function resolveTicketStatus(
	status: SupportTicketStatus,
	labels: SupportLabels = DEFAULT_LABELS
): SupportTicketStatusInfo {
	return { label: labels.ticketStatus(status), ...TICKET_STATUS[status] };
}

/**
 * Which dot a past request draws. `unread` wins when both are set: an unread reply is news, a moved
 * thread is only a hint, and two dots on one row would say neither.
 */
export function resolveConversationDot({
	unread,
	updated,
}: {
	unread?: boolean;
	updated?: boolean;
}): SupportConversationDot {
	if (unread) return "unread";
	if (updated) return "updated";
	return "none";
}

/**
 * Everything a past-request row draws, as one sentence — the dots never speak, so their meaning is
 * here: `"Refund for order #4821, solved, unread reply, 2h. We've issued the refund."`. Absent
 * segments drop out with their commas.
 */
export function resolveConversationA11yLabel(
	{
		title,
		reference,
		status,
		dot,
		timestamp,
		preview,
	}: {
		title: string;
		reference?: string;
		status: SupportTicketStatus;
		dot: SupportConversationDot;
		timestamp?: string;
		preview?: string;
	},
	labels: SupportLabels = DEFAULT_LABELS
): string {
	const dotSegment = dot === "unread" ? labels.unreadReply : dot === "updated" ? labels.updated : undefined;
	const head = labels.conversationSpoken(
		[title, present(reference), labels.ticketStatusSpoken(status), dotSegment, present(timestamp)].filter(
			(segment): segment is string => typeof segment === "string" && segment.length > 0
		)
	);
	const body = present(preview);
	return body ? labels.conversationWithPreview(head, body) : head;
}

/** The first word of a name, or a stand-in when the name is blank. */
function firstName(name: string, labels: SupportLabels): string {
	return name.trim().split(/\s+/)[0] || labels.someone;
}

/**
 * The agent's visible status line. While `typing`, the live state replaces the static one — the two
 * answer the same question and the live one wins — by first name, the way a chat says it. Otherwise
 * the title and availability, or the availability alone.
 */
export function resolveAgentStatusLine(
	{
		name,
		title,
		availability,
		typing,
	}: {
		name: string;
		title?: string;
		availability: SupportAvailability;
		typing?: boolean;
	},
	labels: SupportLabels = DEFAULT_LABELS
): { text: string; live: boolean } {
	if (typing) return { text: labels.typing(firstName(name, labels)), live: true };
	const word = labels.availability(availability);
	const ownTitle = present(title);
	return { text: ownTitle ? labels.agentStatusLine(ownTitle, word) : word, live: false };
}

/** The agent row's spoken label — full name, title and availability, or that they are typing. */
export function resolveAgentA11yLabel(
	{
		name,
		title,
		availability,
		typing,
	}: {
		name: string;
		title?: string;
		availability: SupportAvailability;
		typing?: boolean;
	},
	labels: SupportLabels = DEFAULT_LABELS
): string {
	const fullName = present(name) ?? labels.someone;
	if (typing) return labels.typing(fullName);
	return labels.agentSpoken(
		[fullName, present(title), labels.availabilitySpoken(availability)].filter(
			(segment): segment is string => segment !== undefined
		)
	);
}

/** A topic's spoken label: `"Billing. Invoices, refunds and plans"`. */
export function resolveTopicA11yLabel(
	label: string,
	description?: string,
	labels: SupportLabels = DEFAULT_LABELS
): string {
	const body = present(description);
	return body ? labels.topicSpoken(label, body) : label;
}

/**
 * The topic selected after a press. A disabled topic changes nothing, and the selected one stays
 * selected — a request needs a queue, so a topic is never toggled off.
 */
export function resolveNextTopic(
	current: string | null,
	pressed: string,
	{ disabledValues }: { disabledValues: readonly string[] }
): string | null {
	if (disabledValues.includes(pressed)) return current;
	return pressed;
}

/** The hint an escalating reply adds, so a screen-reader user hears which reply reaches a person. */
export function resolveReplyA11yHint(escalates: boolean, labels: SupportLabels = DEFAULT_LABELS): string | undefined {
	return escalates ? labels.escalateHint : undefined;
}

/**
 * The typing dots' opacities before any animation. Held still they step down `1, 0.6, 0.3`, which
 * still reads as "typing" without moving; moving, every dot starts lit and the loop takes over.
 */
export function resolveTypingOpacities(isCalm: boolean): readonly [number, number, number] {
	return isCalm ? CALM_TYPING_OPACITIES : MOVING_TYPING_OPACITIES;
}
