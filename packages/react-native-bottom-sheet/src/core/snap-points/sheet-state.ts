import { SHEET_STATE, type SheetState } from "../sheet.types";

/** Settle tolerance: a spring at rest is within this of its target. */
const SETTLE_EPSILON = 0.5;

/**
 * Where the sheet is relative to its snap points.
 *
 * `base` decides closed and extended — the keyboard-free height is what the
 * gesture and the scroll lock reason about. `height` decides fill and
 * over-extended, because a keyboard lift or an over-drag pushes the visible
 * sheet past the highest snap point without moving `base`. With no snap points (a
 * dynamic sheet whose content is the only snap point, before it measures) any
 * open height is extended, so the list under it is never locked.
 */
export function sheetState(
	base: number,
	height: number,
	snapPoints: readonly number[],
	closedHeight: number,
	maxHeight: number
): SheetState {
	"worklet";
	if (base <= closedHeight + SETTLE_EPSILON) return SHEET_STATE.CLOSED;
	if (height >= maxHeight - SETTLE_EPSILON) return SHEET_STATE.FILL;

	const count = snapPoints.length;
	const highest = count > 0 ? (snapPoints[count - 1] as number) : base;
	if (height > highest + SETTLE_EPSILON) return SHEET_STATE.OVER_EXTENDED;
	if (base >= highest - SETTLE_EPSILON) return SHEET_STATE.EXTENDED;
	return SHEET_STATE.OPENED;
}
