/** A number for every side, or one number for all four. */
export type SidedNumber =
	| number
	| {
			readonly top?: number;
			readonly right?: number;
			readonly bottom?: number;
			readonly left?: number;
	  };

export type Side = "top" | "right" | "bottom" | "left";

/** One side's value, defaulting to zero. */
export function valueFromSidedNumber(value: SidedNumber | undefined, side: Side): number {
	if (value === undefined) return 0;
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	const side_ = value[side];
	return typeof side_ === "number" && Number.isFinite(side_) ? side_ : 0;
}

/** All four sides at once, in `top right bottom left` order. */
export function sidesOf(value: SidedNumber | undefined): {
	readonly top: number;
	readonly right: number;
	readonly bottom: number;
	readonly left: number;
} {
	return {
		top: valueFromSidedNumber(value, "top"),
		right: valueFromSidedNumber(value, "right"),
		bottom: valueFromSidedNumber(value, "bottom"),
		left: valueFromSidedNumber(value, "left"),
	};
}
