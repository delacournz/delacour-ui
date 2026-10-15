import type { ReactElement } from "react";
import { View } from "react-native";
import { useMessagePart } from "./message.context";
import type { MessageSlotProps } from "./message.types";
import { messageVariants } from "./message.variants";

/** A row of controls under the bubble — reply, copy, anything — aligned to the message's side. */
export function MessageActions({ className, children }: MessageSlotProps): ReactElement {
	const { direction } = useMessagePart("Message.Actions");
	return <View className={messageVariants({ direction }).actions({ className })}>{children}</View>;
}
MessageActions.displayName = "DelacourUI.Message.Actions";
