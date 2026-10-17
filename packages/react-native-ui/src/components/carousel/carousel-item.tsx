import type { ReactElement } from "react";
import type { ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { cn } from "../../lib/cn";
import { resolveWrappedOffset } from "../../lib/paging";
import { Slot } from "../../lib/slot";
import {
	useCarouselMotionPart,
	useCarouselOptionsPart,
	useCarouselPart,
	useCarouselSlidePart,
} from "./carousel.context";
import {
	COVERFLOW_PERSPECTIVE,
	carouselVariants,
	resolveCoverflow,
	resolveSlideAccessibility,
	resolveSlideTranslate,
} from "./carousel.variants";

export type CarouselItemProps = ViewProps & {
	className?: string;
	/**
	 * Render the slide's content as its single child rather than a `View` — a
	 * `Pressable` card, say. The positioning layer stays: it carries the animated
	 * transform, which a plain child cannot take (see `Slot`).
	 */
	asChild?: boolean;
};

/**
 * One slide, absolutely placed in the viewport and moved by its own animated
 * style — never by layout.
 *
 * Every slide reads the one `position` and draws itself at its offset from it:
 * wrapped the short way round when looping, so the first slide sits beside the
 * last with no clones and no jump. Coverflow adds a turn, a scale and a fade from
 * `resolveCoverflow`; under calm motion that is the identity and it draws as a
 * track.
 *
 * Hidden at `opacity: 0` until the viewport is measured, so the first paint never
 * shows every slide stacked at the origin. A slide further out than the window is
 * `display: none` on the UI thread, ahead of React unmounting it.
 */
export function CarouselItem({
	asChild = false,
	className,
	style,
	children,
	...props
}: CarouselItemProps): ReactElement {
	const { count } = useCarouselPart("Carousel.Item");
	const { isCalm, loop, orientation, variant, windowSize } = useCarouselOptionsPart("Carousel.Item");
	const { geometry, position } = useCarouselMotionPart("Carousel.Item");
	const { index, isActive, isPeek } = useCarouselSlidePart("Carousel.Item");

	const isHorizontal = orientation === "horizontal";
	const isCoverflow = variant === "coverflow";
	const turnSign = isHorizontal ? 1 : -1;
	const lengthKey = isHorizontal ? "width" : "height";

	const animatedStyle = useAnimatedStyle(() => {
		const { inset, pitch, size } = geometry.value;
		const offset = loop ? resolveWrappedOffset(index, position.value, count) : index - position.value;
		const distance = offset < 0 ? -offset : offset;
		const turn = isCoverflow ? resolveCoverflow(offset, isCalm) : { opacity: 1, rotateY: 0, scale: 1 };
		const translate = resolveSlideTranslate(offset, pitch, inset);
		const degrees = `${turnSign * turn.rotateY}deg`;

		return {
			[lengthKey]: size,
			display: distance > windowSize + 1 ? "none" : "flex",
			opacity: size > 0 ? turn.opacity : 0,
			transform: isHorizontal
				? [
						{ perspective: COVERFLOW_PERSPECTIVE },
						{ translateX: translate },
						{ rotateY: degrees },
						{ scale: turn.scale },
					]
				: [
						{ perspective: COVERFLOW_PERSPECTIVE },
						{ translateY: translate },
						{ rotateX: degrees },
						{ scale: turn.scale },
					],
			zIndex: Math.round(100 - distance * 10),
		};
	}, [count, index, isCalm, isCoverflow, isHorizontal, lengthKey, loop, turnSign, windowSize]);

	const accessibility = resolveSlideAccessibility({ isActive, isPeek });
	const itemClassName = carouselVariants({ orientation, variant }).item();

	if (asChild) {
		return (
			<Animated.View className={itemClassName} style={animatedStyle} {...accessibility}>
				<Slot className={cn("size-full", className)} style={style} {...props}>
					{children}
				</Slot>
			</Animated.View>
		);
	}

	return (
		<Animated.View
			className={cn(itemClassName, className)}
			style={[style, animatedStyle]}
			{...accessibility}
			{...props}
		>
			{children}
		</Animated.View>
	);
}
CarouselItem.displayName = "DelacourUI.Carousel.Item";
