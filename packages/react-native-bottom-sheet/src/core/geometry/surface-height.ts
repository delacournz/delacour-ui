/**
 * How tall a detached card's surface is right now.
 *
 * Between its snap points the card resizes: its bottom edge stays on the resting
 * line and the top follows `height`. Below the first snap point — a drag down to
 * close, the close animation, a rubber-band under the lowest snap point — and
 * above the last — an over-drag, a keyboard lift — the card is a rigid body:
 * its surface keeps the snap point's height and `translateY` alone moves it, so
 * the bottom corners slide through the gap and off-screen intact rather than
 * collapsing onto the resting line.
 *
 * An attached sheet never needs this: its panel is as tall as the frame and
 * its bottom edge is always off-screen.
 */
export function surfaceHeight(height: number, lowestSnapPoint: number, highestSnapPoint: number): number {
	"worklet";
	const low = lowestSnapPoint > 0 ? lowestSnapPoint : 0;
	const high = highestSnapPoint > low ? highestSnapPoint : low;
	if (height < low) return low;
	if (height > high) return high;
	return height;
}
