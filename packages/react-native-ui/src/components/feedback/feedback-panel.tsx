import { type ReactElement, useCallback } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { FEEDBACK_PANEL_RESIZE_MS, feedbackVariants } from "./feedback.variants";

export type FeedbackPanelProps = ViewProps & { className?: string };

/** No height measured yet: the clip wraps its content until the first layout. */
const UNMEASURED = -1;

/**
 * The recessed well the title, the close and the field sit in.
 *
 * **Its height is measured and animated, never laid out.** The well is drawn
 * inside a clip whose height follows the well's own `onLayout` on a short
 * timing, so when a multi-step flow swaps the panel's children — a rating, then
 * a message, then thanks — the clip eases to the new height. The shell grows
 * with it through ordinary layout and stays centred on every frame, so it never
 * jumps; a layout transition on the panel alone would animate the panel inside
 * a shell that had already snapped to its final size. The first layout lands
 * without animating, and under reduce motion every change does.
 *
 * @example
 * <Feedback.Panel>
 *   <Feedback.Title>What should we fix first?</Feedback.Title>
 *   <Feedback.Close />
 *   <Feedback.Field placeholder="Tell us what got in your way" />
 * </Feedback.Panel>
 */
export function FeedbackPanel({ className, onLayout, ...props }: FeedbackPanelProps): ReactElement {
	const isReduced = useReducedMotion();
	const height = useSharedValue(UNMEASURED);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const next = event.nativeEvent.layout.height;
			height.value =
				height.value === UNMEASURED || isReduced ? next : withTiming(next, { duration: FEEDBACK_PANEL_RESIZE_MS });
			onLayout?.(event);
		},
		[height, isReduced, onLayout]
	);

	const clipStyle = useAnimatedStyle(() => (height.value === UNMEASURED ? {} : { height: height.value }));

	const slots = feedbackVariants();

	return (
		<Animated.View className={slots.clip()} style={clipStyle}>
			<View className={slots.panel({ className })} onLayout={handleLayout} {...props} />
		</Animated.View>
	);
}
FeedbackPanel.displayName = "DelacourUI.Feedback.Panel";
