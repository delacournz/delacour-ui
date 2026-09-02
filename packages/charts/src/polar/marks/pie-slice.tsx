import { Path, type SkPath } from "@shopify/react-native-skia";
import { type ReactElement, type ReactNode, useMemo } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import { useAnimatedPath } from "../../animation/use-animated-path";
import { buildSlicePath } from "../../core/polar/build-slice-path";
import type { PieSliceData } from "../../core/polar/polar.types";
import { toSkPath } from "../../skia/build-path";
import { usePolarContext } from "../polar-chart.context";

export type PieSliceProps = {
	/** Which slice to draw. Read from the chart's context. */
	readonly index?: number;
	/** The slice to draw, when it is not coming from context. */
	readonly slice?: PieSliceData;
	/** A flat fill. Leave it out when a child shader supplies the paint. */
	readonly color?: string;
	readonly opacity?: number;
	readonly animation?: ChartAnimation;
	/** Skia paint children — a gradient, a shader. */
	readonly children?: ReactNode;
};

/**
 * One filled slice.
 *
 * Takes `index` or `slice`, never needing both, the way a cartesian mark takes
 * `yKey` or `points`. Fill only: a stroke on a slice would outline its arcs as
 * well as its edges, and the hairline between slices is `PieInset`'s job.
 *
 * On mount it grows out of the centre — the entrance path is the same slice
 * at radius zero, which shares its eleven verbs and so interpolates. Without
 * that a pie would simply be there on the first frame, and a pie that morphs
 * on every later change but not on its first looks like the mount is broken.
 */
export function PieSlice({ index, slice, color, opacity, animation, children }: PieSliceProps): ReactElement | null {
	const chart = usePolarContext();
	const target = slice ?? (index === undefined ? undefined : chart.slices[index]);

	const path = useMemo(() => (target === undefined ? null : toSkPath(buildSlicePath(target))), [target]);
	const entrance = useMemo(
		() => (target === undefined ? null : toSkPath(buildSlicePath({ ...target, radius: 0, innerRadius: 0 }))),
		[target]
	);

	if (path === null || entrance === null) return null;

	return (
		<AnimatedSlice
			animation={animation ?? chart.animation}
			color={color}
			entrance={entrance}
			opacity={opacity}
			path={path}
		>
			{children}
		</AnimatedSlice>
	);
}

PieSlice.displayName = "DelacourCharts.PieSlice";

type AnimatedSliceProps = {
	readonly path: SkPath;
	readonly entrance: SkPath;
	readonly animation: ChartAnimation;
	readonly color: string | undefined;
	readonly opacity: number | undefined;
	readonly children: ReactNode;
};

/**
 * Split from `PieSlice` so the hook order holds: a slice with no target
 * returns early, and `useAnimatedPath` cannot sit after an early return.
 */
function AnimatedSlice({ path, entrance, animation, color, opacity, children }: AnimatedSliceProps): ReactElement {
	const animated = useAnimatedPath(path, animation, { enterFrom: entrance });
	return (
		<Path color={color} opacity={opacity} path={animated} style="fill">
			{children}
		</Path>
	);
}
