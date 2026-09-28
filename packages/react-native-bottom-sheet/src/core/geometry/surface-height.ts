/**
 * How tall a detached card's surface is right now.
 *
 * Between its detents the card resizes: its bottom edge stays on the resting
 * line and the top follows `height`. Below the first detent — a drag down to
 * close, the close animation, a rubber-band under the lowest detent — and
 * above the last — an over-drag, a keyboard lift — the card is a rigid body:
 * its surface keeps the detent's height and `translateY` alone moves it, so
 * the bottom corners slide through the gap and off-screen intact rather than
 * collapsing onto the resting line.
 *
 * An attached sheet never needs this: its panel is as tall as the frame and
 * its bottom edge is always off-screen.
 */
export function surfaceHeight(height: number, lowestDetent: number, highestDetent: number): number {
	"worklet";
	const low = lowestDetent > 0 ? lowestDetent : 0;
	const high = highestDetent > low ? highestDetent : low;
	if (height < low) return low;
	if (height > high) return high;
	return height;
}
