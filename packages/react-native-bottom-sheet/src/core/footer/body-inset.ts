/**
 * What trails the body, in pixels: the sticky footer — content and band — when
 * there is one, and the safe-area band alone when there is not. Both are the
 * current values, so the reservation collapses with the band as the keyboard
 * rises. Never negative; an unmeasured footer reserves nothing yet.
 *
 * A body is laid out to the sheet's bottom line and reserves this much at its
 * end — a spacer inside a static `Content`, a trailing spacer inside a
 * scrollable's content — so a list's rows run under the footer and the band
 * and its last row can still be scrolled fully clear of them.
 */
export function bodyInset(hasFooter: boolean, footerHeight: number, band: number): number {
	"worklet";
	const value = hasFooter ? footerHeight : band;
	return value > 0 ? value : 0;
}

export type BodyClipInput = {
	/** The geometry's `contentArea` — the body sized against its detent. */
	contentArea: number;
	/** `bodyInset` — what the body reserves at its end. */
	inset: number;
	hasFooter: boolean;
	/** The sheet's live height — `base + keyboardLift`, clamped. */
	sheetHeight: number;
	handleHeight: number;
	/** The keyboard the sheet owns, positive, within the container. */
	keyboardHeight: number;
};

/**
 * How tall the body's clipping box is right now.
 *
 * The body is laid out `contentArea + inset` tall — to the sheet's bottom line
 * — and without a footer that is the clip too: the sheet slides as one body
 * and nothing needs hiding. Under a sticky footer the clip also follows the
 * footer's top edge, `sheetHeight − keyboard − handle − inset`, which is where
 * `footerTop` puts it. On the detent the two agree and the clip is exactly
 * `contentArea`; below it — a drag to close, the close animation — the footer
 * stays on the screen's bottom edge while the panel slides down under it, and
 * the clip shrinks in step so no line of the body is ever drawn below the
 * footer's top, whatever the footer's background. Never negative.
 */
export function bodyClip(input: BodyClipInput): number {
	"worklet";
	const inset = input.inset > 0 ? input.inset : 0;
	const area = (input.contentArea > 0 ? input.contentArea : 0) + inset;
	if (!input.hasFooter) return area;
	const handle = input.handleHeight > 0 ? input.handleHeight : 0;
	const keyboard = input.keyboardHeight > 0 ? input.keyboardHeight : 0;
	const visible = input.sheetHeight - keyboard - handle - inset;
	const clip = visible < area ? visible : area;
	return clip > 0 ? clip : 0;
}

/**
 * The rows' own height: a scrollable's reported content size less the
 * trailing spacer it renders inside that content. This is what the dynamic
 * detent counts — the spacer is the footer and the band, which the detent
 * already adds once. An unmeasured spacer subtracts nothing; never negative.
 */
export function scrollContentHeight(contentSize: number, spacer: number): number {
	const value = contentSize - (spacer > 0 ? spacer : 0);
	return value > 0 ? value : 0;
}
