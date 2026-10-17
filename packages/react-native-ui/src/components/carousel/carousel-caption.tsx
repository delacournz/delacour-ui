import type { ReactElement } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { resolveWrappedOffset } from "../../lib/paging";
import { Text, type TextProps } from "../text";
import {
	useCarouselMotionPart,
	useCarouselOptionsPart,
	useCarouselPart,
	useCarouselSlidePart,
} from "./carousel.context";
import { carouselVariants, resolveCaptionOpacity } from "./carousel.variants";

export type CarouselCaptionProps = TextProps & {
	className?: string;
};

/**
 * A slide's caption, pinned to its foot on a scrim so it reads over a photo.
 *
 * Fades with its slide's offset from `position` — full on the active slide, gone
 * one slide out — so a peeking neighbour shows its picture and not its words. The
 * colour sits on the `Text` (rule 1); the frame carries layout and the scrim only.
 */
export function CarouselCaption({ className, ...props }: CarouselCaptionProps): ReactElement {
	const { count } = useCarouselPart("Carousel.Caption");
	const { loop, orientation, variant } = useCarouselOptionsPart("Carousel.Caption");
	const { position } = useCarouselMotionPart("Carousel.Caption");
	const { index } = useCarouselSlidePart("Carousel.Caption");

	const animatedStyle = useAnimatedStyle(() => {
		const offset = loop ? resolveWrappedOffset(index, position.value, count) : index - position.value;
		return { opacity: resolveCaptionOpacity(offset) };
	}, [count, index, loop]);

	const slots = carouselVariants({ orientation, variant });

	return (
		<Animated.View className={slots.captionFrame()} pointerEvents="none" style={animatedStyle}>
			<Text className={slots.caption({ className })} numberOfLines={2} {...props} />
		</Animated.View>
	);
}
CarouselCaption.displayName = "DelacourUI.Carousel.Caption";
