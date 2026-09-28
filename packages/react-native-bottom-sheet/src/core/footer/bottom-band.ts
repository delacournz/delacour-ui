/**
 * The safe-area band an attached sheet reserves under its content or footer.
 * A detached sheet already floats above the inset and reserves nothing.
 */
export function bottomBand(detached: boolean, bottomInset: number): number {
	"worklet";
	if (detached) return 0;
	return bottomInset > 0 ? bottomInset : 0;
}

/**
 * The band as it stands mid-keyboard: whole at `progress` 0, gone at 1. The
 * keyboard covers the safe area, so the pixels reserved for it are the
 * keyboard's now — and `keyboardLift` subtracts the same amount, which is
 * what keeps the footer still.
 */
export function bandNow(band: number, progress: number): number {
	"worklet";
	const p = progress < 0 ? 0 : progress > 1 ? 1 : progress;
	const value = (band > 0 ? band : 0) * (1 - p);
	return value;
}

/** The sticky footer's full height right now — content plus the band under it, or nothing without a footer. */
export function footerHeight(hasFooter: boolean, footerContentHeight: number, band: number): number {
	"worklet";
	if (!hasFooter) return 0;
	const content = footerContentHeight > 0 ? footerContentHeight : 0;
	return content + (band > 0 ? band : 0);
}
