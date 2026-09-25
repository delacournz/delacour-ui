/**
 * The bottom padding a sheet's static content takes.
 *
 * The safe-area band belongs to whatever is bottom-most in the sheet: with a
 * sticky footer that is the footer, and the content padding it too would
 * count the band twice and leave a gap the height of the home indicator above
 * the footer. With no footer the content is bottom-most and takes it.
 *
 * Lives in the engine so the skin can re-export it without mounting a sheet.
 */
export function resolveSheetBottomInset(input: { hasStickyFooter: boolean; bottom: number }): number {
	return input.hasStickyFooter ? 0 : input.bottom;
}

/**
 * The padding at the end of a sheet's scrollable content: a `footerGap` above
 * a sticky footer's hairline, so the last row does not butt against it, and
 * otherwise the safe-area band as `resolveSheetBottomInset` has it.
 */
export function resolveSheetScrollEndPadding(input: {
	hasStickyFooter: boolean;
	bottom: number;
	footerGap: number;
}): number {
	return input.hasStickyFooter ? input.footerGap : input.bottom;
}
