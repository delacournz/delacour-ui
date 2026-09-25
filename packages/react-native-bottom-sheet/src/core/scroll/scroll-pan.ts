export type ListDragInput = {
	/** `base` when the gesture began. */
	startBase: number;
	/** The pan's translation this gesture; positive is downward. */
	translationY: number;
	/** The list's offset when the gesture began. */
	startOffset: number;
	/**
	 * Whether the list is being held by the lock at that offset — it began
	 * scrolled *and* below the highest detent — and the sheet has not reached
	 * the top yet this gesture. A held list scrolls nothing, so it has no
	 * budget to spend.
	 */
	held: boolean;
	highest: number;
};

/**
 * The height a content pan over a scrollable drags to.
 *
 * The pan and the native scroll are simultaneous, and the finger's travel is
 * shared: what the list scrolls, the sheet must not also move by. Rather than
 * subtract the list's live offset — which races the pan by a frame, so the
 * sheet dips, the lock engages and the list freezes — the offset the list
 * *began* with is a budget the finger has to spend downward before the sheet
 * moves. The list scrolls one-for-one under the same finger, so it reaches its
 * top exactly as the budget runs out, and the sheet takes over from there.
 * Upward, the budget only grows the clamp's slack: a list scrolls up freely
 * and bounces past the top of the sheet rather than over-dragging it, which is
 * what the `highest` clamp does.
 */
export function listDragHeight(input: ListDragInput): number {
	"worklet";
	const budget = input.held ? 0 : Math.max(0, input.startOffset);
	return Math.min(input.startBase - input.translationY + budget, input.highest);
}

export type ListOwnsReleaseInput = {
	/** Whether a scrollable is registered with the sheet at all. */
	scrollable: boolean;
	/** The list's offset at release. */
	offset: number;
	/** The keyboard-free height at release. */
	base: number;
	highest: number;
};

/** Settle tolerance: a sheet within this of a detent is on it. */
const AT_DETENT = 0.5;

/**
 * Whether a released content pan belongs to the list rather than the sheet:
 * the sheet is on its highest detent and the list is scrolled, so the finger
 * was scrolling rows and the release velocity is the list's momentum, not a
 * snap. Snapping here is what made the library this replaces hop from the
 * top to a lower detent under a series of interrupted scrolls.
 */
export function listOwnsRelease(input: ListOwnsReleaseInput): boolean {
	"worklet";
	if (!input.scrollable) return false;
	if (input.offset <= 0) return false;
	return input.base >= input.highest - AT_DETENT;
}

/**
 * Where a list is held while the sheet is below its highest detent.
 *
 * Wherever it was when the lock engaged, never above the top — a handle drag
 * or a `snapToIndex` on a scrolled list keeps its rows. A content pan is the
 * exception: it only leaves the top once the finger has spent the list's
 * whole offset, so the list *is* at the top, whatever the last scroll event
 * to land before the lock reported.
 */
export function scrollLockTarget(offset: number, byContentPan: boolean): number {
	"worklet";
	if (byContentPan) return 0;
	return Math.max(0, offset);
}
