import type { ReactElement } from "react";
import { View } from "react-native";
import { useMessagePart } from "./message.context";
import type { MessageSlotProps } from "./message.types";
import { messageVariants } from "./message.variants";

/** A row above the bubble for `Message.Author` and `Message.Timestamp`, aligned to the message's side. */
export function MessageHeader({ className, children }: MessageSlotProps): ReactElement {
	const { direction } = useMessagePart("Message.Header");
	return <View className={messageVariants({ direction }).header({ className })}>{children}</View>;
}
MessageHeader.displayName = "DelacourUI.Message.Header";
