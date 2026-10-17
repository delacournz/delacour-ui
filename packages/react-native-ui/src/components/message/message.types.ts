import type { ReactNode } from "react";

/**
 * A delivery receipt, for an outgoing message.
 *
 * A union rather than a string so the two states that carry data say so: a
 * `read` may know when, a `failed` may know why. `sending → sent → delivered →
 * read` is the happy path; `failed` can follow any of the first three.
 */
export type MessageStatus =
	| { type: "sending" }
	| { type: "sent" }
	| { type: "delivered" }
	| { type: "read"; readAt?: Date }
	| { type: "failed"; reason?: string };

/** One of {@link MessageStatus}'s discriminants. */
export type MessageStatusType = MessageStatus["type"];

/** Props every plain layout slot takes — `Message.Header`, `.Attachments`, `.Actions`. */
export type MessageSlotProps = {
	children?: ReactNode;
	className?: string;
};
