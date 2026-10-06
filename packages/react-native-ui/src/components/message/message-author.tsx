import type { ReactElement } from "react";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import { useMessageLabelPart, useMessagePart } from "./message.context";
import { messageVariants } from "./message.variants";

export type MessageAuthorProps = {
	children: string;
	/** `primary` colours the name — for a group thread where names tell senders apart. */
	color?: "default" | "primary";
	className?: string;
};

/** The sender's name. A string, because it is also read as the first words of the spoken label. */
export function MessageAuthor({ children, color = "default", className }: MessageAuthorProps): ReactElement {
	const context = useMessagePart("Message.Author");
	useMessageLabelPart(context, { kind: "author", value: children });

	return (
		<Text className={messageVariants().author({ className: cn(color === "primary" && "text-primary", className) })}>
			{children}
		</Text>
	);
}
MessageAuthor.displayName = "DelacourUI.Message.Author";
