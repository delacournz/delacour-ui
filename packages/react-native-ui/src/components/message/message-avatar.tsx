import type { ReactElement } from "react";
import { View } from "react-native";
import { useMessagePart } from "./message.context";
import type { MessageSlotProps } from "./message.types";
import { shouldShowAvatar } from "./message.utils";
import { messageVariants } from "./message.variants";

/**
 * The gutter beside an incoming message. Draws its children — an `Avatar`, or
 * anything — beside the last bubble of a run, and an empty gutter of the same
 * width beside the rest, so every bubble in the run starts on one line.
 *
 * The gutter is `w-8`, an `Avatar` at `size="sm"`. Outgoing messages have no
 * gutter; the root drops this part for them.
 */
export function MessageAvatar({ className, children }: MessageSlotProps): ReactElement {
	const { direction, position } = useMessagePart("Message.Avatar");
	const isShown = shouldShowAvatar(position, direction);

	return (
		<View className={messageVariants().gutter({ className })} importantForAccessibility="no-hide-descendants">
			{isShown ? children : null}
		</View>
	);
}
MessageAvatar.displayName = "DelacourUI.Message.Avatar";
