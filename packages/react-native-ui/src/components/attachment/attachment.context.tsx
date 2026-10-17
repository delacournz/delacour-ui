import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { AttachmentMediaFields } from "./attachment.types";
import type { AttachmentLayout, AttachmentSize, AttachmentStatus } from "./attachment.variants";

export type AttachmentContextValue = AttachmentMediaFields & {
	/** The file's name, as the user knows it. */
	name: string;
	sizeBytes?: number;
	status: AttachmentStatus;
	layout: AttachmentLayout;
	size: AttachmentSize;
	/** Whether the attachment responds to a press right now — a handler, and not disabled. */
	isInteractive: boolean;
	isDisabled: boolean;
	/** What the remove control is called — `Remove report.pdf`, or `Cancel upload`. */
	removeLabel: string;
	onRemove?: () => void;
	onRetry?: () => void;
};

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

/**
 * Supplies the enclosing attachment's media, status and layout to its parts.
 *
 * Lives in its own module, importing nothing but types, so a part can read it
 * without importing `./attachment` — that import would close a cycle, and Metro
 * serves a partially initialised module for one.
 */
export function AttachmentProvider({
	value,
	children,
}: {
	value: AttachmentContextValue;
	children: ReactNode;
}): ReactElement {
	return <AttachmentContext value={value}>{children}</AttachmentContext>;
}
AttachmentProvider.displayName = "DelacourUI.Attachment.Provider";

/** The enclosing attachment's context, or null outside an `<Attachment>`. */
export function useAttachmentContext(): AttachmentContextValue | null {
	return use(AttachmentContext);
}

/**
 * Reads the enclosing attachment — its kind, layout, size, status and name — so
 * a custom child can match it. Throws outside an `<Attachment>`; use
 * {@link useAttachmentContext} where the attachment is optional.
 */
export function useAttachment(): AttachmentContextValue {
	const context = useAttachmentContext();
	if (!context) {
		throw new Error("useAttachment must be called inside an <Attachment>.");
	}
	return context;
}

/**
 * The enclosing attachment's context, for a part that cannot work without one.
 * Its error names the part rather than the hook.
 */
export function useAttachmentPart(component: string): AttachmentContextValue {
	const context = useAttachmentContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside an <Attachment>.`);
	}
	return context;
}

export type AttachmentGroupContextValue = {
	/** Layout for every attachment in the group. A child's own `layout` still wins. */
	layout?: AttachmentLayout;
	/** Size for every attachment in the group. A child's own `size` still wins. */
	size?: AttachmentSize;
};

const AttachmentGroupContext = createContext<AttachmentGroupContextValue | null>(null);

/** Hands an `Attachment.Group`'s layout and size down to the attachments inside it. */
export function AttachmentGroupProvider({
	value,
	children,
}: {
	value: AttachmentGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <AttachmentGroupContext value={value}>{children}</AttachmentGroupContext>;
}
AttachmentGroupProvider.displayName = "DelacourUI.Attachment.Group.Provider";

/** The enclosing group's defaults, or null outside an `Attachment.Group`. */
export function useAttachmentGroupContext(): AttachmentGroupContextValue | null {
	return use(AttachmentGroupContext);
}

export type AttachmentGroupItemValue = {
	/** Position in the group, from 0. */
	index: number;
	/** How many attachments the group holds. */
	count: number;
};

const AttachmentGroupItemContext = createContext<AttachmentGroupItemValue | null>(null);

/** Tells one attachment where it sits in its group, so it can say "2 of 5". */
export function AttachmentGroupItemProvider({
	value,
	children,
}: {
	value: AttachmentGroupItemValue;
	children: ReactNode;
}): ReactElement {
	return <AttachmentGroupItemContext value={value}>{children}</AttachmentGroupItemContext>;
}
AttachmentGroupItemProvider.displayName = "DelacourUI.Attachment.Group.ItemProvider";

/** This attachment's place in its group, or null outside one. */
export function useAttachmentGroupItem(): AttachmentGroupItemValue | null {
	return use(AttachmentGroupItemContext);
}
