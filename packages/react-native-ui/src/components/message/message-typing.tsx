import type { ReactElement } from "react";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import { useMessageLabelPart, useMessagePart } from "./message.context";
import { messageVariants, resolveMessageCornerClass, resolveMessageCorners } from "./message.variants";

const DOT_STAGGER_MS = 120;
const DOT_PULSE_MS = 360;
const DOT_REST_OPACITY = 0.4;

export type MessageTypingProps = {
	className?: string;
};

/**
 * Three dots in a bubble, in place of `Message.Bubble`, while the other side
 * types. Read as "Kate is typing" when a `Message.Author` names them, and
 * announced politely as it appears.
 *
 * The dots pulse in a staggered loop on the UI thread; under reduce motion, or
 * an `isMotionCalm` provider, they rest as three still dots.
 */
export function MessageTyping({ className }: MessageTypingProps): ReactElement {
	const context = useMessagePart("Message.Typing");
	const { direction, position } = context;
	useMessageLabelPart(context, { kind: "typing" });
	const slots = messageVariants({ direction });

	return (
		<View
			accessibilityLiveRegion="polite"
			className={slots.bubble({
				className: cn(resolveMessageCornerClass(resolveMessageCorners(direction, position)), "p-0", className),
			})}
		>
			<View className={slots.typing()}>
				<MessageTypingDot index={0} />
				<MessageTypingDot index={1} />
				<MessageTypingDot index={2} />
			</View>
		</View>
	);
}
MessageTyping.displayName = "DelacourUI.Message.Typing";

function MessageTypingDot({ index }: { index: number }): ReactElement {
	const isCalm = useCalmMotion();
	const opacity = useSharedValue(isCalm ? 1 : DOT_REST_OPACITY);

	useEffect(() => {
		if (isCalm) {
			cancelAnimation(opacity);
			opacity.value = 1;
			return;
		}
		opacity.value = DOT_REST_OPACITY;
		opacity.value = withDelay(
			index * DOT_STAGGER_MS,
			withRepeat(
				withSequence(
					withTiming(1, { duration: DOT_PULSE_MS }),
					withTiming(DOT_REST_OPACITY, { duration: DOT_PULSE_MS })
				),
				-1
			)
		);
		return () => cancelAnimation(opacity);
	}, [index, isCalm, opacity]);

	const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return <Animated.View className={messageVariants().typingDot()} style={style} />;
}
MessageTypingDot.displayName = "DelacourUI.Message.Typing.Dot";
