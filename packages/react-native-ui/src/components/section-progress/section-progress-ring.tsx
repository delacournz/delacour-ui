import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useSectionProgressPart } from "./section-progress.context";
import {
	resolveRingDashOffset,
	resolveRingGeometry,
	resolveSectionColorToken,
	SECTION_PROGRESS_RING_SIZE,
	SECTION_PROGRESS_RING_STROKE,
	sectionProgressVariants,
} from "./section-progress.variants";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CENTRE = SECTION_PROGRESS_RING_SIZE / 2;
const { radius: RADIUS, circumference: CIRCUMFERENCE } = resolveRingGeometry(
	SECTION_PROGRESS_RING_SIZE,
	SECTION_PROGRESS_RING_STROKE
);

/**
 * The ring: a faint full track and a fill whose `strokeDashoffset` follows the
 * progress shared value on the UI thread, so scrolling costs no React render.
 *
 * The fill starts at twelve o'clock — the circle is rotated a quarter turn back
 * — and takes the active section's colour. Hidden from assistive technology; the
 * percent is in the pill's accessibility value.
 */
export function SectionProgressRing(): ReactElement {
	const { color, progress } = useSectionProgressPart("SectionProgress.Ring");
	const stroke = useThemeColor(resolveSectionColorToken(color));
	const track = useThemeColor("border");

	const animatedProps = useAnimatedProps(() => ({
		strokeDashoffset: resolveRingDashOffset(progress.value, CIRCUMFERENCE),
	}));

	return (
		<View
			accessibilityElementsHidden
			className={sectionProgressVariants().ring()}
			importantForAccessibility="no-hide-descendants"
		>
			<Svg height={SECTION_PROGRESS_RING_SIZE} width={SECTION_PROGRESS_RING_SIZE}>
				<Circle
					cx={CENTRE}
					cy={CENTRE}
					fill="none"
					r={RADIUS}
					stroke={track}
					strokeWidth={SECTION_PROGRESS_RING_STROKE}
				/>
				<AnimatedCircle
					animatedProps={animatedProps}
					cx={CENTRE}
					cy={CENTRE}
					fill="none"
					origin={`${CENTRE}, ${CENTRE}`}
					r={RADIUS}
					rotation={-90}
					stroke={stroke}
					strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
					strokeLinecap="butt"
					strokeWidth={SECTION_PROGRESS_RING_STROKE}
				/>
			</Svg>
		</View>
	);
}
SectionProgressRing.displayName = "DelacourUI.SectionProgress.Ring";
