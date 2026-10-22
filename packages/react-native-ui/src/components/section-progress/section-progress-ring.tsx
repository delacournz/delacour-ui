import type { ReactElement } from "react";
import { View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { Canvas, Circle, Path, Skia } from "react-native-skia";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useSectionProgressPart } from "./section-progress.context";
import {
	resolveRingGeometry,
	resolveRingOval,
	resolveRingTrimEnd,
	resolveSectionColorToken,
	SECTION_PROGRESS_RING_SIZE,
	SECTION_PROGRESS_RING_STROKE,
	sectionProgressVariants,
} from "./section-progress.variants";

const CENTRE = SECTION_PROGRESS_RING_SIZE / 2;
const { radius: RADIUS } = resolveRingGeometry(SECTION_PROGRESS_RING_SIZE, SECTION_PROGRESS_RING_STROKE);
const CANVAS_STYLE = { height: SECTION_PROGRESS_RING_SIZE, width: SECTION_PROGRESS_RING_SIZE };

/**
 * The whole circle as one contour from twelve o'clock, clockwise — start index 0 is the oval's
 * top point — so the trim grows from the top. Built once: the trim is all that moves.
 */
const FILL_PATH = Skia.PathBuilder.Make()
	.addOval(resolveRingOval(SECTION_PROGRESS_RING_SIZE, SECTION_PROGRESS_RING_STROKE), false, 0)
	.detach();

/**
 * The ring: a faint full track and a fill trimmed to the progress shared value on the UI
 * thread, so scrolling costs no React render and builds no path.
 *
 * The fill starts at twelve o'clock and takes the active section's colour. Colours are resolved
 * here, above the canvas — context does not cross into Skia's reconciler. Hidden from assistive
 * technology; the percent is in the pill's accessibility value.
 */
export function SectionProgressRing(): ReactElement {
	const { color, progress } = useSectionProgressPart("SectionProgress.Ring");
	const stroke = useThemeColor(resolveSectionColorToken(color)) ?? "transparent";
	const track = useThemeColor("border") ?? "transparent";

	const end = useDerivedValue(() => resolveRingTrimEnd(progress.value));

	return (
		<View
			accessibilityElementsHidden
			className={sectionProgressVariants().ring()}
			importantForAccessibility="no-hide-descendants"
		>
			<Canvas style={CANVAS_STYLE}>
				<Circle
					color={track}
					cx={CENTRE}
					cy={CENTRE}
					r={RADIUS}
					strokeWidth={SECTION_PROGRESS_RING_STROKE}
					style="stroke"
				/>
				<Path
					color={stroke}
					end={end}
					path={FILL_PATH}
					start={0}
					strokeCap="butt"
					strokeWidth={SECTION_PROGRESS_RING_STROKE}
					style="stroke"
				/>
			</Canvas>
		</View>
	);
}
SectionProgressRing.displayName = "DelacourUI.SectionProgress.Ring";
