import type { ReactNode } from "react";
import type { MeterColor, MeterRegion } from "./meter.variants";

/**
 * What a render function inside a meter is handed.
 *
 * Shared by the root's context and `Meter.Output`, which is what puts it here
 * rather than in either one's own file. See AGENTS.md.
 */
export type MeterRenderProps = {
	/** The reading, clamped to the scale. */
	value: number;
	minValue: number;
	maxValue: number;
	/** Where the reading sits on the scale, 0–1. */
	ratio: number;
	/** The readout's default text: `valueLabel`, or the formatted reading. */
	formatted: string;
	/** The colour the reading was judged to be. */
	color: MeterColor;
	/** The region the reading falls in, when the meter was given `low`, `high` or `optimum`. */
	region: MeterRegion | null;
	/** How many blocks a segmented meter draws, or `null` for the continuous bar. */
	segments: number | null;
	/** How many of those blocks are lit. `0` on the continuous bar. */
	litSegments: number;
};

/** A part whose children may be written out or computed from the meter's state. */
export type MeterRenderChildren = ReactNode | ((props: MeterRenderProps) => ReactNode);
