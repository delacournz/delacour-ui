import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { resolveWrappedOffset } from "../../lib/paging";
import { useCarouselMotionPart, useCarouselOptionsPart, useCarouselPart } from "./carousel.context";
import {
	CAROUSEL_DEFAULT_MAX_DOTS,
	type CarouselDotTone,
	type CarouselOrientation,
	carouselVariants,
	resolveCaptionOpacity,
	resolveDotLength,
	resolveDotsWindow,
} from "./carousel.variants";

export type CarouselDotsProps = ViewProps & {
	/** Cap on dots drawn; beyond it a sliding window of this many. Default 7. */
	maxDots?: number;
	/** `overlay` draws light dots for sitting on photos. Default `default`. */
	tone?: CarouselDotTone;
	className?: string;
};

/**
 * One dot per slide, the active one stretched to a pill — a reading of `position`,
 * so the pill travels with a finger rather than jumping on release.
 *
 * **Decoration, not a control.** The group is hidden from assistive tech, because
 * the adjustable viewport already says "2 of 5", and the dots are not tappable:
 * at six points they are far below a 44-point target. The arrows are the control.
 *
 * Past `maxDots` the row is a window centred on the active dot, chosen from the
 * committed index. Renders nothing with one slide or none.
 */
export function CarouselDots({
	maxDots = CAROUSEL_DEFAULT_MAX_DOTS,
	tone = "default",
	className,
	...props
}: CarouselDotsProps): ReactElement | null {
	const { count, index } = useCarouselPart("Carousel.Dots");
	const { loop, orientation, variant } = useCarouselOptionsPart("Carousel.Dots");
	const { position } = useCarouselMotionPart("Carousel.Dots");

	if (count <= 1) return null;

	const { start, end } = resolveDotsWindow(count, index, maxDots);
	const slots = carouselVariants({ orientation, tone, variant });
	const dots: number[] = [];
	for (let dot = start; dot < end; dot++) dots.push(dot);

	return (
		<View
			accessibilityElementsHidden
			className={slots.dots({ className })}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			{...props}
		>
			{dots.map((dot) => (
				<CarouselDot
					activeClassName={slots.dotActive()}
					className={slots.dot()}
					count={count}
					index={dot}
					key={dot}
					loop={loop}
					orientation={orientation}
					position={position}
				/>
			))}
		</View>
	);
}
CarouselDots.displayName = "DelacourUI.Carousel.Dots";

type CarouselDotProps = {
	index: number;
	count: number;
	loop: boolean;
	orientation: CarouselOrientation;
	position: SharedValue<number>;
	className: string;
	activeClassName: string;
};

/**
 * One dot. Its length along the row and its active fill's opacity both follow its
 * offset from `position`; width rather than `scaleX`, because a scaled
 * `rounded-full` is an ellipse.
 */
function CarouselDot({
	index,
	count,
	loop,
	orientation,
	position,
	className,
	activeClassName,
}: CarouselDotProps): ReactElement {
	const isHorizontal = orientation === "horizontal";

	const dotStyle = useAnimatedStyle(() => {
		const offset = loop ? resolveWrappedOffset(index, position.value, count) : index - position.value;
		const length = resolveDotLength(offset);
		return isHorizontal ? { width: length } : { height: length };
	}, [count, index, isHorizontal, loop]);

	const fillStyle = useAnimatedStyle(() => {
		const offset = loop ? resolveWrappedOffset(index, position.value, count) : index - position.value;
		return { opacity: resolveCaptionOpacity(offset) };
	}, [count, index, loop]);

	return (
		<Animated.View className={className} style={dotStyle}>
			<Animated.View className={activeClassName} style={fillStyle} />
		</Animated.View>
	);
}
CarouselDot.displayName = "DelacourUI.Carousel.Dots.Dot";
