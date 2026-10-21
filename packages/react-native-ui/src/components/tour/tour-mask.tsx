import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { Canvas, Group, Rect, RoundedRect, Skia } from "react-native-skia";
import "../../lib/skia-native-id";
import { useThemeColor } from "../../hooks/use-theme-color";
import { resolveMaskHole, TOUR_SCRIM_TOKEN, type TourSize } from "./tour.variants";

/** A hole, one shared value per edge and the corner, read on the UI thread so a step change renders nothing. */
export type TourHoleValues = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	width: SharedValue<number>;
	height: SharedValue<number>;
	radius: SharedValue<number>;
};

/** Round a hole's values into the rounded rectangle Skia erases. */
function useHoleRRect(hole: TourHoleValues) {
	return useDerivedValue(() => {
		const cut = resolveMaskHole({
			x: hole.x.value,
			y: hole.y.value,
			width: hole.width.value,
			height: hole.height.value,
			radius: hole.radius.value,
		});
		return Skia.RRectXY(Skia.XYWHRect(cut.x, cut.y, cut.width, cut.height), cut.radius, cut.radius);
	});
}

/**
 * The dimmed window with the hole cut out.
 *
 * One Skia `Canvas`: a window-sized `Rect` in the scrim colour, then two rounded rectangles that
 * erase it (`dstOut`) — the current hole and the one it replaced. Between steps the old hole's
 * opacity falls to zero while the new one's rises, so the dim fills in where the tour was and
 * lifts where it is going, with nothing travelling between them. Each rectangle is derived on the
 * UI thread from its shared values, so a step change renders nothing. The whole drawing fades up
 * by `dim` when the tour opens, around a hole that is already open. The colour is resolved out
 * here, above the canvas, where the app's theme is still in reach. It takes no touches; the scrim
 * beneath it decides what a tap does.
 */
export function TourMask({
	size,
	hole,
	previous,
	reveal,
	previousReveal,
	dim,
}: {
	size: TourSize;
	hole: TourHoleValues;
	/** The hole being filled in. */
	previous: TourHoleValues;
	/** How open the current hole is, 0–1. */
	reveal: SharedValue<number>;
	/** How open the previous hole still is, 0–1. */
	previousReveal: SharedValue<number>;
	/** How far the dim has faded up, 0–1 — the tour's entrance. */
	dim: SharedValue<number>;
}): ReactElement {
	const fill = useThemeColor(TOUR_SCRIM_TOKEN) ?? "transparent";
	const { width, height } = size;
	const current = useHoleRRect(hole);
	const old = useHoleRRect(previous);

	return (
		<Canvas pointerEvents="none" style={[StyleSheet.absoluteFill, { width, height }]}>
			<Group layer opacity={dim}>
				<Rect color={fill} height={height} width={width} x={0} y={0} />
				<RoundedRect blendMode="dstOut" color="black" opacity={previousReveal} rect={old} />
				<RoundedRect blendMode="dstOut" color="black" opacity={reveal} rect={current} />
			</Group>
		</Canvas>
	);
}
TourMask.displayName = "DelacourUI.Tour.Mask";
