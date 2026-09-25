export type FooterTopInput = {
	/** The sheet's visible height — `base + keyboardLift`. */
	sheetHeight: number;
	/** The keyboard the sheet owns, positive, within the container. */
	keyboardHeight: number;
	/** The footer's measured content, band excluded; `UNMEASURED` counts as zero. */
	footerContentHeight: number;
	/** The band under the footer right now — `bandNow(band, progress)`. */
	band: number;
};

/**
 * The sticky footer's `translateY` inside the body: the sheet's height less
 * the keyboard, the footer's content and the band under it, never negative.
 *
 * Fed the current band rather than the resting one, this is constant across a
 * keyboard animation — `footer-top.test.ts` sweeps the proof. The footer is
 * the one thing that does not move when the keyboard does.
 */
export function footerTop(input: FooterTopInput): number {
	"worklet";
	const keyboard = input.keyboardHeight > 0 ? input.keyboardHeight : 0;
	const footer = input.footerContentHeight > 0 ? input.footerContentHeight : 0;
	const band = input.band > 0 ? input.band : 0;
	const top = input.sheetHeight - keyboard - footer - band;
	return top > 0 ? top : 0;
}
