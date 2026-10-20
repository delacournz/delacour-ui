import { createContext, type ReactElement, type ReactNode, use, useEffect, useId } from "react";
import type { MessageStatus } from "./message.types";
import type { MessageLabelPart } from "./message.utils";
import type { MessageDirection, MessagePosition, MessageSize, MessageTone } from "./message.variants";

export type MessageContextValue = {
	direction: MessageDirection;
	position: MessagePosition;
	/** The receipt, outgoing only — always `undefined` on an incoming message. */
	status: MessageStatus | undefined;
	tone: MessageTone;
	size: MessageSize;
	isOutgoing: boolean;
	/** The message has an `onPress` or an `onLongPress`. */
	isInteractive: boolean;
	isSelected: boolean;
	/** The root is not one accessibility element — each part is read on its own. */
	isCompound: boolean;
	onPress: (() => void) | undefined;
	onLongPress: (() => void) | undefined;
	onRetry: (() => void) | undefined;
	/** Internal: a part reports the words it draws, or `undefined` to withdraw them. */
	reportLabelPart: (id: string, part: MessageLabelPart | undefined) => void;
};

const MessageContext = createContext<MessageContextValue | null>(null);

/**
 * Supplies the enclosing message's side, run position, receipt and handlers to
 * its parts.
 *
 * Lives in its own module so a part can read it without importing `./message`
 * and closing a cycle through the root. See the package AGENTS.md, rule 3.
 */
export function MessageProvider({
	value,
	children,
}: {
	value: MessageContextValue;
	children: ReactNode;
}): ReactElement {
	return <MessageContext value={value}>{children}</MessageContext>;
}
MessageProvider.displayName = "DelacourUI.Message.Provider";

/** The enclosing message's context, or null outside a `<Message>`. */
export function useMessageContext(): MessageContextValue | null {
	return use(MessageContext);
}

/**
 * Reads the enclosing message, so a custom part can match its side, fill and
 * receipt. Throws outside a `<Message>`.
 */
export function useMessage(): MessageContextValue {
	const context = useMessageContext();
	if (!context) {
		throw new Error("useMessage must be called inside a <Message>.");
	}
	return context;
}

/**
 * The enclosing message's context, for a part that cannot work without one.
 * Internal: not re-exported from `index.ts`.
 */
export function useMessagePart(component: string): MessageContextValue {
	const context = useMessageContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Message>.`);
	}
	return context;
}

/**
 * Reports a part's words to the root's spoken label while the part is mounted,
 * and withdraws them when it unmounts or stops drawing them.
 */
export function useMessageLabelPart(context: MessageContextValue, part: MessageLabelPart | undefined): void {
	const id = useId();
	const { reportLabelPart } = context;
	const kind = part?.kind;
	const value = part && part.kind !== "typing" ? part.value : undefined;

	useEffect(() => {
		if (kind === undefined) {
			reportLabelPart(id, undefined);
			return;
		}
		reportLabelPart(id, kind === "typing" ? { kind } : { kind, value: value ?? "" });
		return () => reportLabelPart(id, undefined);
	}, [id, kind, value, reportLabelPart]);
}
