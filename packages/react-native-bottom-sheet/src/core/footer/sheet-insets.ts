/**
 * The safe-area band the engine reserves under a sheet's static content.
 *
 * The band belongs to whatever is bottom-most in the sheet: with a sticky
 * footer that is the footer, whose styled box pads through the band, so the
 * content reserves none of it. With no footer the content is bottom-most and
 * `Content`'s trailing spacer holds it. This is what the engine reserves, not
 * something a skin adds — a skin that padded the band as well would count it
 * twice and leave a gap the height of the home indicator.
 *
 * Lives in the engine so the skin can re-export it without mounting a sheet.
 */
export function resolveSheetBottomInset(input: { hasStickyFooter: boolean; bottom: number }): number {
	return input.hasStickyFooter ? 0 : input.bottom;
}

/**
 * The padding a skin adds at the end of a sheet's scrollable content: a
 * `footerGap` above a sticky footer's hairline, so the last row does not butt
 * against it, and otherwise nothing — the engine's scrollables already end
 * their content with a spacer the height of the footer or the band, so the
 * rows scroll under either and the last one can be brought fully clear.
 */
export function resolveSheetScrollEndPadding(input: {
	hasStickyFooter: boolean;
	bottom: number;
	footerGap: number;
}): number {
	return input.hasStickyFooter ? input.footerGap : 0;
}
