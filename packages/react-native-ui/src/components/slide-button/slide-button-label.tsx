import type { ReactElement, ReactNode } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Text, type TextProps } from "../text";
import { useSlideButtonPart } from "./slide-button.context";
import {
	resolveSlideLabelGutter,
	resolveSlideTrailOpacity,
	resolveSlideTrailWidth,
	SLIDE_BUTTON_INSET,
	slideButtonVariants,
} from "./slide-button.variants";

export type SlideButtonLabelProps = Omit<TextProps, "children" | "className"> & {
	children: ReactNode;
	className?: string;
};

/**
 * What the slide does, centred in the whole rail.
 *
 * **It does not fade or move.** The handle passes over it. A label that faded as
 * the handle advanced would leave the control saying nothing for the second half
 * of the gesture — the half where the hand most wants to know what it is about to
 * confirm.
 *
 * **It changes colour where the trail covers it.** A second copy, in the trail's
 * own foreground, is clipped to the trail's width. A state variant's trail is
 * its full colour, and its soft label colour on that fill is the same hue on the
 * same hue — the words would vanish exactly where the trail reached them.
 *
 * **It keeps a handle's width clear on both sides.** Symmetric, so it stays
 * centred in the rail; wide enough that a long label truncates before it runs
 * under the resting handle.
 *
 * Its text is also the rail's accessibility label, read off by the root, so the
 * screen reader announces the same words the eye reads. The rail is the
 * accessible element, so neither copy is read on its own.
 */
export function SlideButtonLabel({ className, ...props }: SlideButtonLabelProps): ReactElement {
	const { variant, size, handleWidth, offset, travel } = useSlideButtonPart("SlideButton.Label");
	const slots = slideButtonVariants({ size, variant });

	const frameStyle = useAnimatedStyle(() => ({
		paddingHorizontal: resolveSlideLabelGutter({ handleWidth: handleWidth.value, inset: SLIDE_BUTTON_INSET }),
	}));

	const clipStyle = useAnimatedStyle(() => ({
		opacity: handleWidth.value > 0 ? resolveSlideTrailOpacity(offset.value) : 0,
		width: resolveSlideTrailWidth({ handleWidth: handleWidth.value, inset: SLIDE_BUTTON_INSET, offset: offset.value }),
	}));

	const onTrailStyle = useAnimatedStyle(() => ({
		paddingHorizontal: resolveSlideLabelGutter({ handleWidth: handleWidth.value, inset: SLIDE_BUTTON_INSET }),
		width: travel.value + handleWidth.value + SLIDE_BUTTON_INSET * 2,
	}));

	return (
		<>
			<Animated.View className={slots.labelFrame()} pointerEvents="none" style={frameStyle}>
				<Text className={slots.label({ className })} numberOfLines={1} {...props} />
			</Animated.View>
			<Animated.View className={slots.labelClip()} pointerEvents="none" style={clipStyle}>
				<Animated.View className={slots.labelOnTrailFrame()} style={onTrailStyle}>
					<Text className={slots.labelOnTrail({ className })} numberOfLines={1} {...props} />
				</Animated.View>
			</Animated.View>
		</>
	);
}
SlideButtonLabel.displayName = "DelacourUI.SlideButton.Label";
