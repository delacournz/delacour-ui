/**
 * A dragged height pulled back toward `[min, max]` with rubber-band
 * resistance once it leaves the range.
 *
 * Beyond either end the travel is `(√(1 + 2·over / factor) − 1) · factor`:
 * slope 1 at the boundary so the sheet never jumps or races the finger,
 * then square-root growth — monotone and sub-linear, so the finger is always
 * ahead. A `factor` of `0` is a hard clamp, and a larger factor allows more
 * travel. An inverted range collapses to `min`.
 */
export function resistOverDrag(height: number, min: number, max: number, factor: number): number {
	"worklet";
	if (max < min) return min;
	if (height >= min && height <= max) return height;
	if (!(factor > 0)) return height < min ? min : max;

	if (height > max) {
		const over = height - max;
		return max + (Math.sqrt(1 + (2 * over) / factor) - 1) * factor;
	}
	const under = min - height;
	return min - (Math.sqrt(1 + (2 * under) / factor) - 1) * factor;
}
