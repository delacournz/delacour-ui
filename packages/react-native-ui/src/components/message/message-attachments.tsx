import type { ReactElement } from "react";
import { View } from "react-native";
import { useMessagePart } from "./message.context";
import type { MessageSlotProps } from "./message.types";
import { messageVariants } from "./message.variants";

/**
 * A clipped, gapped stack for media and attachment tiles. Inside a
 * `Message.Bubble` with `isMedia` it fills the bubble edge to edge; on its own
 * it sits in the column under or over the bubble.
 */
export function MessageAttachments({ className, children }: MessageSlotProps): ReactElement {
	useMessagePart("Message.Attachments");
	return <View className={messageVariants().attachments({ className })}>{children}</View>;
}
MessageAttachments.displayName = "DelacourUI.Message.Attachments";
