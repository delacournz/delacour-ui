import type { ReactElement, ReactNode } from "react";
import { Text, type TextProps } from "../text";
import { useMessageLabelPart, useMessagePart } from "./message.context";
import { extractMessageText } from "./message.utils";
import { messageVariants } from "./message.variants";

export type MessageTextProps = Omit<TextProps, "variant" | "color" | "children"> & {
	children?: ReactNode;
};

/**
 * Body text on the bubble's foreground, at the message's `size`. Nested `Text`
 * — a link, a bold run — inherits it and is read as part of the sentence.
 *
 * Not selectable by default: selection takes the long press the message uses
 * for its actions. Pass `selectable` to trade one for the other.
 */
export function MessageText({ className, children, ...props }: MessageTextProps): ReactElement {
	const context = useMessagePart("Message.Text");
	const { direction, tone, size } = context;
	useMessageLabelPart(context, { kind: "text", value: extractMessageText(children) });

	return (
		<Text className={messageVariants({ direction, size, tone }).text({ className })} {...props}>
			{children}
		</Text>
	);
}
MessageText.displayName = "DelacourUI.Message.Text";
