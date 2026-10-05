import type { ReactElement, ReactNode } from "react";
import Animated from "react-native-reanimated";
import { cn } from "../../lib/cn";
import { Pressable } from "../pressable";
import { TextClassProvider } from "../text";
import { useMessagePart } from "./message.context";
import { messageVariants, resolveMessageCornerClass, resolveMessageCorners } from "./message.variants";

const BUBBLE_PRESSED_SCALE = 0.98;

export type MessageBubbleProps = {
	/**
	 * The bubble holds only media — a `Message.Attachments` — so it drops its
	 * padding and clips the media to its corners. The app says so; the bubble
	 * does not inspect its children to guess.
	 */
	isMedia?: boolean;
	className?: string;
	children?: ReactNode;
};

/**
 * The bubble: fill, padding and corners, from the message's side, tone, size,
 * run position and receipt.
 *
 * Corners are logical (`rounded-ss-*` and friends), so a run mirrors under RTL
 * with nothing else said. With an `onPress` or `onLongPress` on the message it
 * is a `Pressable` that eases to 0.98 under the finger; the message root, not
 * the bubble, is what a screen reader focuses.
 *
 * Publishes its text slot to bare `Text` inside it, so a `<Text>` written in
 * place of `Message.Text` still lands on the bubble's foreground.
 */
export function MessageBubble({ isMedia = false, className, children }: MessageBubbleProps): ReactElement {
	const { direction, position, tone, size, status, isSelected, isCompound, onPress, onLongPress } =
		useMessagePart("Message.Bubble");
	const slots = messageVariants({
		direction,
		isFailed: status?.type === "failed",
		isMedia,
		isSelected,
		isSending: status?.type === "sending",
		size,
		tone,
	});
	const bubbleClassName = slots.bubble({
		className: cn(resolveMessageCornerClass(resolveMessageCorners(direction, position)), className),
	});
	const content = <TextClassProvider value={slots.text()}>{children}</TextClassProvider>;

	if (onPress || onLongPress) {
		return (
			<Pressable
				accessible={isCompound}
				className={bubbleClassName}
				onLongPress={onLongPress}
				onPress={onPress}
				pressedScale={BUBBLE_PRESSED_SCALE}
			>
				{content}
			</Pressable>
		);
	}

	return <Animated.View className={bubbleClassName}>{content}</Animated.View>;
}
MessageBubble.displayName = "DelacourUI.Message.Bubble";
