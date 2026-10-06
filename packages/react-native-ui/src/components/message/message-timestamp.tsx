import type { ReactElement } from "react";
import { Text } from "../text";
import { useMessageLabelPart, useMessagePart } from "./message.context";
import { formatMessageTime } from "./message.utils";
import { messageVariants } from "./message.variants";

export type MessageTimestampProps = {
	date: Date;
	/** Replaces the chat-list format — time today, `Yesterday`, a weekday, a short date. */
	format?: (date: Date) => string;
	locale?: string;
	className?: string;
};

/** When the message was sent. The formatted string is drawn and read in the spoken label. */
export function MessageTimestamp({ date, format, locale, className }: MessageTimestampProps): ReactElement {
	const context = useMessagePart("Message.Timestamp");
	const text = format ? format(date) : formatMessageTime(date, new Date(), locale);
	useMessageLabelPart(context, { kind: "time", value: text });

	return <Text className={messageVariants().timestamp({ className })}>{text}</Text>;
}
MessageTimestamp.displayName = "DelacourUI.Message.Timestamp";
