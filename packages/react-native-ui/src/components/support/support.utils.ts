import type { BadgeColor } from "../badge/badge.variants";
import type { SupportAvailability, SupportTicketStatus } from "./support.types";

export { SUPPORT_AVAILABILITIES, SUPPORT_TICKET_STATUSES } from "./support.types";

/** Which dot a past request draws: a reply nobody has read, a thread that moved, or nothing. */
export type SupportConversationDot = "unread" | "updated" | "none";

/** What a ticket status looks like and says. */
export type SupportTicketStatusInfo = {
	/** The badge's words. */
	label: string;
	/** The soft badge colour it is painted in. */
	color: Extract<BadgeColor, "info" | "warning" | "success" | "default">;
	/** The team is waiting on the reader — the one status that asks them to act. */
	needsReader: boolean;
};

const AVAILABILITY_LABEL: Record<SupportAvailability, string> = {
	online: "Online",
	away: "Away",
	offline: "Offline",
};

const AVAILABILITY_STATUS: Record<SupportAvailability, string> = {
	online: "We're online",
	away: "We're away",
	offline: "We're offline",
};

const TICKET_STATUS: Record<SupportTicketStatus, SupportTicketStatusInfo> = {
	open: { label: "Open", color: "info", needsReader: false },
	pending: { label: "Waiting on you", color: "warning", needsReader: true },
	solved: { label: "Solved", color: "success", needsReader: false },
	closed: { label: "Closed", color: "default", needsReader: false },
};

const DOT_SEGMENT: Record<SupportConversationDot, string | null> = {
	unread: "unread reply",
	updated: "updated",
	none: null,
};

const CALM_TYPING_OPACITIES = [1, 0.6, 0.3] as const;
const MOVING_TYPING_OPACITIES = [1, 1, 1] as const;

/** A caller's string, or `undefined` when it is missing or blank — empty is absent. */
function present(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

/** The short word for an availability — `Online`, `Away`, `Offline`. */
export function resolveAvailabilityWord(availability: SupportAvailability): string {
	return AVAILABILITY_LABEL[availability];
}

/**
 * What the status line shows: the caller's wording when there is any ("Typically replies in under
 * an hour"), else the availability's own sentence ("We're online").
 */
export function resolveAvailabilityLabel(availability: SupportAvailability, replyTime?: string): string {
	return present(replyTime) ?? AVAILABILITY_STATUS[availability];
}

/**
 * What the status line says to a screen reader. The availability leads, because the dot that draws
 * it is decorative and colour alone must not carry it: `"Away. Back tomorrow"`.
 */
export function resolveStatusA11yLabel(availability: SupportAvailability, replyTime?: string): string {
	const wording = present(replyTime);
	const word = AVAILABILITY_LABEL[availability];
	return wording ? `${word}. ${wording}` : word;
}

/** A ticket status's label, soft badge colour, and whether it is waiting on the reader. */
export function resolveTicketStatus(status: SupportTicketStatus): SupportTicketStatusInfo {
	return TICKET_STATUS[status];
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
export function resolveConversationA11yLabel({
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
}): string {
	const head = [
		title,
		present(reference),
		TICKET_STATUS[status].label.toLowerCase(),
		DOT_SEGMENT[dot],
		present(timestamp),
	]
		.filter((segment): segment is string => typeof segment === "string" && segment.length > 0)
		.join(", ");
	const body = present(preview);
	return body ? `${head}. ${body}` : head;
}

/** The first word of a name, or a stand-in when the name is blank. */
function firstName(name: string): string {
	return name.trim().split(/\s+/)[0] || "Someone";
}

/**
 * The agent's visible status line. While `typing`, the live state replaces the static one — the two
 * answer the same question and the live one wins — by first name, the way a chat says it. Otherwise
 * the title and availability, or the availability alone.
 */
export function resolveAgentStatusLine({
	name,
	title,
	availability,
	typing,
}: {
	name: string;
	title?: string;
	availability: SupportAvailability;
	typing?: boolean;
}): { text: string; live: boolean } {
	if (typing) return { text: `${firstName(name)} is typing`, live: true };
	const word = AVAILABILITY_LABEL[availability];
	const ownTitle = present(title);
	return { text: ownTitle ? `${ownTitle} · ${word}` : word, live: false };
}

/** The agent row's spoken label — full name, title and availability, or that they are typing. */
export function resolveAgentA11yLabel({
	name,
	title,
	availability,
	typing,
}: {
	name: string;
	title?: string;
	availability: SupportAvailability;
	typing?: boolean;
}): string {
	const fullName = present(name) ?? "Someone";
	if (typing) return `${fullName} is typing`;
	return [fullName, present(title), AVAILABILITY_LABEL[availability].toLowerCase()]
		.filter((segment): segment is string => segment !== undefined)
		.join(", ");
}

/** A topic's spoken label: `"Billing. Invoices, refunds and plans"`. */
export function resolveTopicA11yLabel(label: string, description?: string): string {
	const body = present(description);
	return body ? `${label}. ${body}` : label;
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
export function resolveReplyA11yHint(escalates: boolean): string | undefined {
	return escalates ? "Talk to a person" : undefined;
}

/**
 * The typing dots' opacities before any animation. Held still they step down `1, 0.6, 0.3`, which
 * still reads as "typing" without moving; moving, every dot starts lit and the loop takes over.
 */
export function resolveTypingOpacities(isCalm: boolean): readonly [number, number, number] {
	return isCalm ? CALM_TYPING_OPACITIES : MOVING_TYPING_OPACITIES;
}
