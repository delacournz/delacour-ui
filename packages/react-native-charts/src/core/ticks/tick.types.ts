/** One axis tick: what it means, and where it sits. */
export type ChartTick = {
	/** The domain value. Epoch milliseconds on a time scale. */
	readonly value: number;
	/** Canvas position in points, already through the scale. */
	readonly position: number;
};
