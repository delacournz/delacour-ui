/** Everything the dynamic detent is a sum of, in height space. */
export type DynamicDetentInput = {
	/** Measured handle height; `UNMEASURED` counts as zero. */
	handleHeight: number;
	/** Measured content height; `UNMEASURED` counts as zero. */
	contentHeight: number;
	/** Measured footer content height; ignored when `hasFooter` is false. */
	footerContentHeight: number;
	/** The safe-area band under the sheet — zero for a detached sheet. */
	band: number;
	hasFooter: boolean;
	/** The height the sheet may occupy. */
	available: number;
	/** An optional cap on the whole detent, below `available`. */
	maxDynamicContentSize?: number;
};

/**
 * The detent a sheet sized to its content settles at.
 *
 * Handle, content and — unlike the library this replaces — the footer's
 * content are all in, and the safe-area band exactly once: it lives inside the
 * footer when there is one and under the content when there is not. Capped by
 * `maxDynamicContentSize` and always by `available`.
 */
export function dynamicDetent(input: DynamicDetentInput): number {
	"worklet";
	const handle = input.handleHeight > 0 ? input.handleHeight : 0;
	const content = input.contentHeight > 0 ? input.contentHeight : 0;
	const footer = input.hasFooter && input.footerContentHeight > 0 ? input.footerContentHeight : 0;
	const band = input.band > 0 ? input.band : 0;
	const available = input.available > 0 ? input.available : 0;

	let cap = available;
	if (input.maxDynamicContentSize !== undefined && input.maxDynamicContentSize < cap) {
		cap = input.maxDynamicContentSize > 0 ? input.maxDynamicContentSize : 0;
	}

	const sum = handle + content + footer + band;
	return sum < cap ? sum : cap;
}
