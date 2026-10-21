import { Canvas, Group, Rect, Skia } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { useThemeColor } from "../../hooks/use-theme-color";
import { resolveMaskHole, TOUR_SCRIM_TOKEN, type TourSize } from "./tour.variants";

/** The hole, one shared value per edge, so each travels on its own timing and nothing re-renders. */
export type TourHoleValues = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	width: SharedValue<number>;
	height: SharedValue<number>;
	radius: SharedValue<number>;
};

/**
 * The dimmed window with the hole cut out.
 *
 * One Skia `Canvas`: a window-sized `Rect` in the scrim colour, inside a `Group` that clips out
 * the hole (`invertClip`), so the hole is subtracted rather than painted over. The clip is a
 * rounded rectangle derived on the UI thread from the hole's shared values, so the hole glides
 * between targets with no React render and no path string. The colour is resolved out here,
 * above the canvas, where the app's theme is still in reach. It takes no touches; the scrim
 * beneath it decides what a tap does.
 */
export function TourMask({ size, hole }: { size: TourSize; hole: TourHoleValues }): ReactElement {
	const fill = useThemeColor(TOUR_SCRIM_TOKEN) ?? "transparent";
	const { width, height } = size;

	const clip = useDerivedValue(() => {
		const cut = resolveMaskHole({
			x: hole.x.value,
			y: hole.y.value,
			width: hole.width.value,
			height: hole.height.value,
			radius: hole.radius.value,
		});
		return Skia.RRectXY(Skia.XYWHRect(cut.x, cut.y, cut.width, cut.height), cut.radius, cut.radius);
	});

	return (
		<Canvas pointerEvents="none" style={[StyleSheet.absoluteFill, { width, height }]}>
			<Group clip={clip} invertClip>
				<Rect color={fill} height={height} width={width} x={0} y={0} />
			</Group>
		</Canvas>
	);
}
TourMask.displayName = "DelacourUI.Tour.Mask";
