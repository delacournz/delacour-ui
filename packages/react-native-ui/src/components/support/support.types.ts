import type { ReactNode } from "react";
import type { ViewProps } from "react-native";

/** Whether anyone is there to answer. Decided once, on the root. */
export const SUPPORT_AVAILABILITIES = ["online", "away", "offline"] as const;

/** Where a request stands. `pending` means the team is waiting on the reader. */
export const SUPPORT_TICKET_STATUSES = ["open", "pending", "solved", "closed"] as const;

export type SupportAvailability = (typeof SUPPORT_AVAILABILITIES)[number];
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

/**
 * A titled block of rows — `Support.Channels`, `Support.Conversations` and `Support.Articles` all
 * take exactly this shape, and the internal section leaf renders it.
 */
export type SupportSectionProps = Omit<ViewProps, "children"> & {
	/** The heading above the rows. Absent ⇒ no heading. */
	title?: string;
	/** A line under the heading. */
	description?: string;
	children: ReactNode;
	className?: string;
};
