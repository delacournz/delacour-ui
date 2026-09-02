import { Path, type SkPath } from "@shopify/react-native-skia";
import { type ReactElement, useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { useAnimatedPath } from "../../animation/use-animated-path";
import { buildSliceEdgePath } from "../../core/polar/build-slice-path";
import { toSkPath } from "../../skia/build-path";
import { usePolarContext } from "../polar-chart.context";

export type PieInsetProps = {
	readonly color: string;
	readonly strokeWidth?: number;
	readonly opacity?: number;
	readonly animation?: ChartAnimation;
};

/**
 * A hairline between neighbouring slices.
 *
 * One stroked `M L` per slice's start edge, plus the last slice's end edge
 * when the slices do not close the circle. Drawn in the background colour it
 * reads as a gap; drawn in a foreground colour it reads as a border.
 *
 * Nothing is drawn for fewer than two slices or for a slice that is the whole
 * circle: there is no neighbour to separate, and a single line from the
 * centre to 12 o'clock on a full disc is a scratch, not an inset.
 */
export function PieInset({ color, strokeWidth = 1, opacity, animation }: PieInsetProps): ReactElement | null {
	const { slices, circleSweepDegrees, animation: chartAnimation } = usePolarContext();

	const edges = useMemo<SkPath[]>(() => {
		if (slices.length < 2 || slices.some((slice) => slice.sliceIsEntireCircle)) return [];
		const paths = slices.map((slice) => toSkPath(buildSliceEdgePath(slice, "start")));
		const last = slices[slices.length - 1];
		if (last !== undefined && circleSweepDegrees < 360) paths.push(toSkPath(buildSliceEdgePath(last, "end")));
		return paths;
	}, [slices, circleSweepDegrees]);

	if (edges.length === 0) return null;

	return (
		<>
			{edges.map((edge, index) => (
				<InsetEdge
					animation={animation ?? chartAnimation}
					color={color}
					key={`${edges.length}-${index}`}
					opacity={opacity}
					path={edge}
					strokeWidth={strokeWidth}
				/>
			))}
		</>
	);
}

PieInset.displayName = "DelacourCharts.PieInset";

type InsetEdgeProps = {
	readonly path: SkPath;
	readonly color: string;
	readonly strokeWidth: number;
	readonly opacity: number | undefined;
	readonly animation: ChartAnimation;
};

/** One edge, morphing with its slice. A component so each edge owns a hook. */
function InsetEdge({ path, color, strokeWidth, opacity, animation }: InsetEdgeProps): ReactElement {
	const animated = useAnimatedPath(path, animation);
	return <Path color={color} opacity={opacity} path={animated} strokeWidth={strokeWidth} style="stroke" />;
}
