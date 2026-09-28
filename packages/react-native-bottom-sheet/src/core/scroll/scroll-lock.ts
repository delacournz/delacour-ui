import { SHEET_STATE, type SheetState } from "../sheet.types";

/**
 * Whether a scrollable inside the sheet is pinned in place.
 *
 * Below the highest detent a drag on the list moves the sheet, not the rows,
 * so the list is held at its lock offset every frame. At the highest detent
 * and beyond it scrolls. With the content pan disabled there is nothing else
 * the drag could do, so the list is never locked.
 */
export function shouldLockScroll(state: SheetState, enableContentPan: boolean): boolean {
	"worklet";
	if (!enableContentPan) return false;
	return state !== SHEET_STATE.EXTENDED && state !== SHEET_STATE.OVER_EXTENDED && state !== SHEET_STATE.FILL;
}

export type ContentPanInput = {
	/** `shouldLockScroll` right now. */
	locked: boolean;
	/** The scrollable's offset; negative when bounced past the top. */
	contentOffsetY: number;
	/** The pan's translation this gesture; positive is downward. */
	translationY: number;
};

/**
 * Whether the content pan should move the sheet rather than let the list
 * scroll: always while locked, and at the top of an unlocked list only when
 * the finger is pulling down. Everything else is the list's.
 */
export function contentPanDrivesSheet(input: ContentPanInput): boolean {
	"worklet";
	if (input.locked) return true;
	return input.contentOffsetY <= 0 && input.translationY > 0;
}
