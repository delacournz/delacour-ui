export type ContentAreaInput = {
	/** The sheet's visible height for sizing the body — `min(maxHeight, highest + keyboardLift)`. */
	sheetHeight: number;
	handleHeight: number;
	/** The sticky footer's full height, band included; zero without one. */
	footerHeight: number;
	/** The keyboard the sheet owns, positive, within the container. */
	keyboardHeight: number;
	/** The safe-area band trailing the content when there is no footer to hold it. */
	trailingBand: number;
};

/**
 * The height the body may fill: whatever the handle, the footer, the keyboard
 * and the trailing band leave of the sheet. Never negative, and an unmeasured
 * part subtracts nothing.
 */
export function contentArea(input: ContentAreaInput): number {
	"worklet";
	const handle = input.handleHeight > 0 ? input.handleHeight : 0;
	const footer = input.footerHeight > 0 ? input.footerHeight : 0;
	const keyboard = input.keyboardHeight > 0 ? input.keyboardHeight : 0;
	const band = input.trailingBand > 0 ? input.trailingBand : 0;
	const area = input.sheetHeight - handle - footer - keyboard - band;
	return area > 0 ? area : 0;
}
