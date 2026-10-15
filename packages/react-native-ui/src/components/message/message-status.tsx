import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { IconCheckmark1Small, IconClock, IconDoubleCheckmark1Small, IconExclamationCircle } from "../../icons/central";
import { Icon, type IconComponent } from "../icon";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useMessageLabelPart, useMessagePart } from "./message.context";
import type { MessageStatusType } from "./message.types";
import { resolveMessageStatusLabel, shouldShowStatus } from "./message.utils";
import { MESSAGE_STATUS_TOKEN, messageVariants } from "./message.variants";

const GLYPH_ENTERING = FadeIn.duration(120);

const STATUS_GLYPH: Record<MessageStatusType, IconComponent> = {
	sending: IconClock,
	sent: IconCheckmark1Small,
	delivered: IconDoubleCheckmark1Small,
	read: IconDoubleCheckmark1Small,
	failed: IconExclamationCircle,
};

export type MessageStatusProps = {
	/** Replaces the receipt's words, drawn and spoken — `Seen 9:42`, say. */
	label?: string;
	className?: string;
};

/**
 * The delivery receipt: a glyph and its words, under the last outgoing bubble
 * of a run and nowhere else — it renders nothing on an incoming message, and
 * nothing mid-run.
 *
 * `read` is the info token, `failed` the destructive one; the rest are muted.
 * A failed receipt with an `onRetry` on the message adds a Retry control. The
 * glyph cross-fades as the status moves, and holds still under reduce motion.
 */
export function MessageStatusRow({ label, className }: MessageStatusProps): ReactElement | null {
	const context = useMessagePart("Message.Status");
	const { direction, position, status, onRetry } = context;
	const isCalm = useCalmMotion();
	const isShown = status !== undefined && shouldShowStatus(position, direction);
	useMessageLabelPart(context, isShown && label ? { kind: "statusLabel", value: label } : undefined);

	if (!isShown) return null;

	const slots = messageVariants({ direction, statusType: status.type });
	const text = label ?? resolveMessageStatusLabel(status);

	return (
		<View className={slots.status({ className })}>
			<Animated.View entering={isCalm ? undefined : GLYPH_ENTERING} key={status.type}>
				<Icon color={MESSAGE_STATUS_TOKEN[status.type]} icon={STATUS_GLYPH[status.type]} size="xs" />
			</Animated.View>
			<Text className={slots.statusLabel()}>{text}</Text>
			{status.type === "failed" && onRetry ? (
				<Pressable accessibilityLabel="Retry" feedback="fade" hitSlop={8} onPress={onRetry}>
					<Text className={slots.retry()}>Retry</Text>
				</Pressable>
			) : null}
		</View>
	);
}
MessageStatusRow.displayName = "DelacourUI.Message.Status";
