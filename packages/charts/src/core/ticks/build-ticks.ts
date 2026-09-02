import { scaleValue } from "../scale/scale";
import type { ScaleDescriptor } from "../scale/scale.types";
import { linearTicks, logTicks } from "./linear-ticks";
import type { ChartTick } from "./tick.types";
import { DEFAULT_TICK_COUNT, downsampleTicks } from "./tick-count";
import { timeTicks } from "./time-ticks";

export type BuildTicksOptions = {
	/** How many ticks to aim for. A suggestion — the generator rounds it to human values. */
	readonly count?: number;
	/** Explicit values, used instead of generating any. Downsampled to `count`. */
	readonly values?: readonly number[];
};

/**
 * Tick values for a scale, each already positioned on the canvas.
 *
 * Positions come from `scaleValue` rather than a second d3 call so an axis and
 * its marks can never disagree about where a value sits.
 */
export function buildTicks(scale: ScaleDescriptor, options: BuildTicksOptions = {}): ChartTick[] {
	const count = options.count ?? DEFAULT_TICK_COUNT;
	const values = options.values ? downsampleTicks(options.values, count) : generate(scale, count);
	return values.map((value) => ({ value, position: scaleValue(scale, value) }));
}

function generate(scale: ScaleDescriptor, count: number): number[] {
	switch (scale.kind) {
		case "linear":
			return linearTicks(scale.domain, count);
		case "time":
			return timeTicks(scale.domain, count);
		case "log":
			return logTicks(scale.domain, scale.base, count);
	}
}
