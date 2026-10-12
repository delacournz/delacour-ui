import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import { IconDefaultsProvider } from "../icon";
import { Text } from "../text";
import { TextClassProvider } from "../text/text.context";
import type { AnimatedBadgeAnimatedStyle, AnimatedBadgeFrame } from "./animated-badge.types";
import {
	type AnimatedBadgeSize,
	resolveAnimatedBadgeForeground,
	resolveAnimatedBadgeSlots,
} from "./animated-badge.variants";
import { AnimatedBadgeGlyph } from "./animated-badge-glyph";

export type AnimatedBadgeContentProps = {
	frame: AnimatedBadgeFrame;
	size: AnimatedBadgeSize;
	labelClassName: string | undefined;
	/** The roll's offset and opacity, from `useAnimatedBadgeRoll`. */
	rollStyle: AnimatedBadgeAnimatedStyle;
	isPulsing: boolean;
};

/**
 * The moving unit: glyph and label in one row, rolled as one view.
 *
 * Paints from the frame it is handed rather than from the root's props, so the
 * outgoing word keeps its own colour until it has left. A text label is drawn
 * on one line — the measurer lays the next one out on one line too, and the
 * capsule springs to that width.
 */
export function AnimatedBadgeContent({
	frame,
	size,
	labelClassName,
	rollStyle,
	isPulsing,
}: AnimatedBadgeContentProps): ReactElement {
	const slots = resolveAnimatedBadgeSlots({ status: frame.status, size, labelClassName });
	const iconDefaults = { className: slots.icon, color: resolveAnimatedBadgeForeground(frame.status) };

	return (
		<IconDefaultsProvider value={iconDefaults}>
			<TextClassProvider value={slots.label}>
				<Animated.View className={slots.content} style={rollStyle}>
					<AnimatedBadgeGlyph icon={frame.icon} isPulsing={isPulsing} kind={frame.glyph} status={frame.status} />
					{frame.text === undefined ? (
						frame.label
					) : (
						<Text className={slots.label} numberOfLines={1}>
							{frame.text}
						</Text>
					)}
				</Animated.View>
			</TextClassProvider>
		</IconDefaultsProvider>
	);
}
AnimatedBadgeContent.displayName = "DelacourUI.AnimatedBadge.Content";
