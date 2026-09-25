/**
 * How far above the container's bottom edge the sheet rests: nothing when
 * attached, the detached `bottomOffset` plus the safe-area inset when
 * floating. Every height in the engine is measured up from here.
 */
export function restingBottom(detached: boolean, bottomOffset: number, bottomInset: number): number {
	"worklet";
	if (!detached) return 0;
	const offset = bottomOffset > 0 ? bottomOffset : 0;
	const inset = bottomInset > 0 ? bottomInset : 0;
	return offset + inset;
}

/**
 * The height at which the sheet is closed: `−restingBottom`, so a detached
 * sheet's top edge clears the container's bottom edge and a
 * `positionFor(C, restingBottom, closedHeight)` is exactly `C`.
 */
export function closedHeight(restingBottomValue: number): number {
	"worklet";
	return 0 - restingBottomValue;
}

/** The height the sheet may occupy — the container less the resting bottom, never negative. */
export function availableHeight(containerHeight: number, restingBottomValue: number): number {
	"worklet";
	const available = containerHeight - restingBottomValue;
	return available > 0 ? available : 0;
}
