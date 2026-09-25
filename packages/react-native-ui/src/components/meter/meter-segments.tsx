import { type ReactElement, useEffect } from "react";
import { View, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useMeterPart } from "./meter.context";
import { METER_SEGMENT_FADE_MS, type MeterColor, type MeterSize, meterVariants } from "./meter.variants";

export type MeterSegmentsProps = Omit<ViewProps, "children"> & {
	/** Extra classes for every block. */
	segmentClassName?: string;
	/** Extra classes for a lit block's painted layer. */
	fillClassName?: string;
};

type MeterSegmentProps = {
	isLit: boolean;
	color: MeterColor;
	size: MeterSize;
	className?: string;
	fillClassName?: string;
};

/**
 * One block: an unlit groove with its lit layer fading over it.
 *
 * The layer is seeded at its current state, so a meter mounting at three of
 * four does not replay the lighting on every row that scrolls in. The timing
 * takes Reanimated's default reduce-motion policy, so with the system setting on
 * a block lights without a fade — nothing here needs to stay moving to be read.
 */
function MeterSegment({ isLit, color, size, className, fillClassName }: MeterSegmentProps): ReactElement {
	const opacity = useSharedValue(isLit ? 1 : 0);

	useEffect(() => {
		opacity.value = withTiming(isLit ? 1 : 0, { duration: METER_SEGMENT_FADE_MS });
	}, [isLit, opacity]);

	const fillStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
	const slots = meterVariants({ color, size });

	return (
		<View className={slots.segment({ className })}>
			<Animated.View className={slots.segmentFill({ className: fillClassName })} style={fillStyle} />
		</View>
	);
}
MeterSegment.displayName = "DelacourUI.Meter.Segments.Segment";

/**
 * The scale drawn as discrete blocks — the segmented meter's track and fill in one.
 *
 * Draws the count the root was given as `segments`, lighting whole blocks only:
 * four blocks say "three out of four" where a bar says "about seventy percent".
 * With no count on the root it draws nothing, because there is no scale to cut.
 */
export function MeterSegments({
	className,
	segmentClassName,
	fillClassName,
	...props
}: MeterSegmentsProps): ReactElement | null {
	const { size, renderProps } = useMeterPart("Meter.Segments");
	const { segments, litSegments, color } = renderProps;

	if (segments === null) return null;

	const blocks = Array.from({ length: segments }, (_, index) => index);

	return (
		<View className={meterVariants({ color, size }).segments({ className })} {...props}>
			{blocks.map((index) => (
				<MeterSegment
					className={segmentClassName}
					color={color}
					fillClassName={fillClassName}
					isLit={index < litSegments}
					key={index}
					size={size}
				/>
			))}
		</View>
	);
}
MeterSegments.displayName = "DelacourUI.Meter.Segments";
