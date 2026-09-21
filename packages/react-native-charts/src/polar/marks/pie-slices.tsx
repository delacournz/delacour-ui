import type { ReactElement, ReactNode } from "react";
import type { ChartAnimation } from "../../animation/animation.types";
import type { PieSliceData } from "../../core/polar/polar.types";
import { sliceOpacity } from "../../core/polar/slice-opacity";
import { usePolarContext } from "../polar-chart.context";
import { PieSlice } from "./pie-slice";

export type PieSlicesProps = {
	/** One per slice, cycled when there are more slices than colours. */
	readonly colors: readonly string[];
	readonly opacity?: number;
	/** Opacity of every slice but the selected one, while one is selected. */
	readonly dimUnselected?: number;
	readonly animation?: ChartAnimation;
	/** Skia paint children for each slice — a gradient, a shader. */
	readonly children?: (slice: PieSliceData, color: string) => ReactNode;
};

/**
 * Every slice of the chart, one `PieSlice` each.
 *
 * Colours cycle rather than stop: a palette of five under twenty slices
 * colours all twenty, and a slice with no colour would be an invisible wedge
 * that still takes taps.
 *
 * While `selectedIndex` is set, the other slices draw at `dimUnselected`. The
 * default dims them, because a selection that changes nothing on screen looks
 * like a tap that missed. `1` turns it off.
 */
export function PieSlices({
	colors,
	opacity = 1,
	dimUnselected = 0.4,
	animation,
	children,
}: PieSlicesProps): ReactElement | null {
	const { slices, selectedIndex } = usePolarContext();
	if (colors.length === 0) return null;

	return (
		<>
			{slices.map((slice) => {
				const color = colors[slice.index % colors.length] as string;
				return (
					<PieSlice
						animation={animation}
						color={color}
						key={slice.index}
						opacity={sliceOpacity(slice.index, selectedIndex, opacity, dimUnselected)}
						slice={slice}
					>
						{children?.(slice, color)}
					</PieSlice>
				);
			})}
		</>
	);
}

PieSlices.displayName = "DelacourCharts.PieSlices";
