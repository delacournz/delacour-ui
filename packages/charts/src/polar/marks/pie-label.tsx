import { type SkFont, Text } from "@shopify/react-native-skia";
import type { ReactElement, ReactNode } from "react";
import { sliceLabelPosition } from "../../core/polar/label-position";
import type { PieSliceData } from "../../core/polar/polar.types";
import { anchorX, anchorY } from "../../core/text/label-anchor";
import { fontMetrics, measureLabelWidth } from "../../skia/font";
import { usePolarContext } from "../polar-chart.context";

export type PieLabelProps = {
	readonly color: string;
	/** Overrides the chart's font. */
	readonly font?: SkFont | null;
	/** Across the annulus: 0 the inner edge, 1 the outer, more than 1 outside. */
	readonly radiusOffset?: number;
	/** The text for a slice. Defaults to its label. */
	readonly formatLabel?: (slice: PieSliceData) => string;
	/** Slices narrower than this, in degrees, get no label. */
	readonly minSweep?: number;
	readonly opacity?: number;
	/** Skia paint children — a shader for the text. */
	readonly children?: ReactNode;
};

/**
 * A text label on every slice wide enough to hold one.
 *
 * Skia text, for the reason the axes use it: the labels move with the canvas.
 * Draws nothing while the font is `null`, and nothing on a slice narrower than
 * `minSweep` — a label on a two-degree slice lands on its neighbours, and
 * three overlapping labels are less legible than none.
 */
export function PieLabel({
	color,
	font,
	radiusOffset = 0.5,
	formatLabel,
	minSweep = 0,
	opacity,
	children,
}: PieLabelProps): ReactElement | null {
	const chart = usePolarContext();
	const face = font === undefined ? chart.font : font;
	if (face === null) return null;
	const metrics = font === undefined ? chart.fontMetrics : fontMetrics(face);

	return (
		<>
			{chart.slices.map((slice) => {
				if (slice.sweepAngle <= 0 || slice.sweepAngle < minSweep) return null;
				const text = formatLabel === undefined ? slice.label : formatLabel(slice);
				if (text === "") return null;
				const position = sliceLabelPosition(slice, radiusOffset);
				return (
					<Text
						color={color}
						font={face}
						key={slice.index}
						opacity={opacity}
						text={text}
						x={anchorX(position.x, measureLabelWidth(face, text), "middle")}
						y={anchorY(position.y, metrics, "middle")}
					>
						{children}
					</Text>
				);
			})}
		</>
	);
}

PieLabel.displayName = "DelacourCharts.PieLabel";
