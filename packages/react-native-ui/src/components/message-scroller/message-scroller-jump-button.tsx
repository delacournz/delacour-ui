import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedReaction, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { IconArrowDown } from "../../icons/central";
import { cn } from "../../lib/cn";
import { Icon } from "../icon";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useMessageScrollerPart } from "./message-scroller.context";
import type { MessageScrollerJumpButtonProps } from "./message-scroller.types";
import { DEFAULT_JUMP_LABEL, formatUnreadCount, resolveJumpButtonLabel } from "./message-scroller.utils";
import {
	MESSAGE_SCROLLER_JUMP_TIMING_MS,
	messageScrollerVariants,
	resolveJumpButtonLift,
	resolveJumpButtonMotion,
} from "./message-scroller.variants";

/** Extends the 36pt pill to a 44pt target without growing what is drawn. */
const HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

/**
 * The floating "jump to latest" pill, with the unread count beside its arrow.
 *
 * Visibility comes from the scroller's UI-thread hysteresis, so the pill tracks the thumb without a
 * JS round trip; only its touchability and its place in the accessibility tree wait for React, and
 * those change once per crossing. It rises with the keyboard by the same amount the list's content
 * does, and sits `bottomInset` above the list's bottom edge so a composer drawn over the list never
 * covers it.
 */
export function MessageScrollerJumpButton({
	label = DEFAULT_JUMP_LABEL,
	placement,
	showCount = true,
	onPress,
	children,
	className,
	testID,
}: MessageScrollerJumpButtonProps): ReactElement {
	const { state, controller, isJumpVisible, isCalm, keyboardOffset, bottomInset } =
		useMessageScrollerPart("MessageScroller.JumpButton");
	const keyboard = useReanimatedKeyboardAnimation();
	const [isShown, setIsShown] = useState(false);
	const slots = messageScrollerVariants({ placement });

	useAnimatedReaction(
		() => isJumpVisible.value,
		(visible, previous) => {
			if (visible !== previous) scheduleOnRN(setIsShown, visible);
		}
	);

	const animatedStyle = useAnimatedStyle(() => {
		const motion = resolveJumpButtonMotion({ isVisible: isJumpVisible.value, isCalm });
		const lift = resolveJumpButtonLift({ keyboardHeight: keyboard.height.value, keyboardOffset, bottomInset });
		const duration = MESSAGE_SCROLLER_JUMP_TIMING_MS;
		return {
			opacity: withTiming(motion.opacity, { duration }),
			// Two translations, not one sum: `withTiming` returns an animation descriptor, not a number,
			// and arithmetic on it is NaN. The lift tracks the keyboard frame by frame; the slide eases.
			transform: [{ translateY: -lift }, { translateY: withTiming(motion.translateY, { duration }) }],
		};
	});

	const count = formatUnreadCount(state.unreadCount);
	const handlePress = onPress ?? (() => controller.scrollToEnd());

	return (
		<Animated.View
			accessibilityElementsHidden={!isShown}
			className={slots.jumpButtonContainer()}
			importantForAccessibility={isShown ? "auto" : "no-hide-descendants"}
			pointerEvents={isShown ? "box-none" : "none"}
			style={animatedStyle}
		>
			<Pressable
				accessibilityLabel={resolveJumpButtonLabel(state.unreadCount, label)}
				accessibilityRole="button"
				className={cn(slots.jumpButton(), className)}
				hitSlop={HIT_SLOP}
				onPress={handlePress}
				testID={testID}
			>
				{children ?? (
					<>
						<Icon color="card-foreground" icon={IconArrowDown} size="sm" />
						{showCount && count !== "" ? (
							<View accessibilityLiveRegion="polite" className={slots.jumpCount()}>
								<Text className={slots.jumpCountLabel()}>{count}</Text>
							</View>
						) : null}
					</>
				)}
			</Pressable>
		</Animated.View>
	);
}
MessageScrollerJumpButton.displayName = "DelacourUI.MessageScroller.JumpButton";
