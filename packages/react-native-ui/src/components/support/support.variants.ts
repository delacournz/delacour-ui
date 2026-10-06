import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { BadgeVariant } from "../badge/badge.variants";
import type { ChipColor } from "../chip/chip.variants";
import type { SupportConversationDot } from "./support.utils";

/** Every dot a past-request row can draw, `none` included — it keeps the slot's width. */
export const SUPPORT_CONVERSATION_DOTS = [
	"unread",
	"updated",
	"none",
] as const satisfies readonly SupportConversationDot[];

/**
 * The badge family a ticket status is painted in. A soft badge, so a status reads as a label beside
 * the title rather than as a button; the colour is `resolveTicketStatus`'s.
 */
export const SUPPORT_TICKET_BADGE_VARIANT = "soft" as const satisfies BadgeVariant;

/** Theme token an icon in `Support.Note` inherits. */
export const SUPPORT_NOTE_ICON_TOKEN = "muted-foreground";

/** Theme token an icon in a `Support.Topic` inherits. */
export const SUPPORT_TOPIC_ICON_TOKEN = "foreground";

/**
 * The chip colour a suggested reply is painted in. The one that reaches a person is the
 * primary-soft chip, so it stands out from the answers that keep the reader with the assistant.
 */
export function resolveReplyColor(escalates: boolean): ChipColor {
	return escalates ? "primary" : "default";
}

/**
 * Styling for every part of a help section.
 *
 * One slotted `tv()` for all seventeen parts, so an axis — availability, the conversation dot, a
 * topic's selection — is declared once and every part reading it agrees.
 *
 * The rows that are `Item`s inside a `ListGroup` (channels, past requests, articles) take their
 * metrics from those components and need no slot of their own here beyond the trailing detail and
 * the dot; restating `Item`'s padding would let the two drift. A ticket status is a soft `Badge`
 * and a reply is a soft `Chip`, for the same reason.
 *
 * Text colour sits on text slots only — a React Native `View` does not cascade colour to a `Text`.
 * The dots are fills, never text. No raw palette colour and no `dark:` — the theme's variable swap
 * handles both modes.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const supportVariants = tv({
	slots: {
		root: "gap-6",
		header: "flex-row items-start gap-3",
		headerText: "flex-1 gap-1",
		title: "font-semibold text-2xl text-foreground",
		description: "text-base text-muted-foreground",
		statusRow: "flex-row items-center gap-2",
		statusDot: "size-2 rounded-full",
		statusLabel: "flex-1 text-muted-foreground text-sm",
		section: "gap-2",
		sectionHeader: "gap-0.5 px-1",
		sectionTitle: "font-medium text-muted-foreground text-sm",
		sectionDescription: "text-muted-foreground text-xs",
		rowDetail: "text-muted-foreground text-sm",
		rowMeta: "items-end gap-1",
		topics: "gap-2",
		topic: "flex-row items-center gap-3 rounded-lg border px-4 py-3",
		topicContent: "flex-1 gap-0.5",
		topicTitle: "font-medium text-base text-foreground",
		topicDescription: "text-muted-foreground text-sm",
		topicIcon: "size-icon-md",
		topicIndicator: "size-5 items-center justify-center rounded-full border-2",
		topicIndicatorDot: "size-2.5 rounded-full bg-primary",
		conversationDot: "size-2 rounded-full",
		conversationTitle: "shrink",
		agent: "flex-row items-center gap-3",
		agentText: "flex-1 gap-0.5",
		agentName: "font-medium text-base text-foreground",
		agentStatus: "text-muted-foreground text-sm",
		agentStatusLine: "flex-row items-center gap-2",
		typing: "flex-row items-center gap-1",
		typingDot: "size-1.5 rounded-full bg-muted-foreground",
		handoff: "flex-row items-center gap-3 py-2",
		handoffRule: "flex-1",
		handoffLabel: "max-w-[75%] text-center text-muted-foreground text-xs",
		note: "flex-row items-center justify-center gap-2 px-4 py-2",
		noteIcon: "size-icon-sm",
		noteLabel: "shrink text-center text-muted-foreground text-xs",
		replies: "flex-row gap-2",
		resolution: "items-center gap-3 rounded-lg border border-border bg-card p-4",
		resolutionQuestion: "text-center font-medium text-base text-foreground",
	},
	variants: {
		availability: {
			online: { statusDot: "bg-success" },
			away: { statusDot: "bg-warning" },
			offline: { statusDot: "bg-muted-foreground" },
		},
		dot: {
			unread: { conversationDot: "bg-primary", conversationTitle: "font-semibold" },
			updated: { conversationDot: "bg-muted-foreground" },
			none: { conversationDot: "bg-transparent" },
		},
		// The empty `false` branches are load-bearing typing, not placeholders.
		// See the note in button.variants.ts.
		selected: {
			true: { topic: "border-primary bg-tertiary", topicIndicator: "border-primary" },
			false: { topic: "border-border bg-card", topicIndicator: "border-border" },
		},
		isDisabled: {
			true: { topic: "opacity-50" },
			false: {},
		},
	},
	defaultVariants: {
		availability: "offline",
		dot: "none",
		selected: false,
		isDisabled: false,
	},
});

export type SupportVariantProps = VariantProps<typeof supportVariants>;
