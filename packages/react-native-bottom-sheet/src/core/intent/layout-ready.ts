export type LayoutReadyInput = {
	containerHeight: number;
	handleHeight: number;
	contentHeight: number;
	footerContentHeight: number;
	/** Whether the content's height is a detent, and so has to be known. */
	dynamicSizing: boolean;
	hasFooter: boolean;
};

/**
 * Whether every measurement this configuration needs has landed, which is
 * what an open intent waits on. The container must be real; the handle must
 * have reported (zero is a report); content only matters when the sheet sizes
 * to it, and the footer only when there is one.
 */
export function isLayoutReady(input: LayoutReadyInput): boolean {
	"worklet";
	if (!(input.containerHeight > 0)) return false;
	if (input.handleHeight < 0) return false;
	if (input.dynamicSizing && input.contentHeight < 0) return false;
	if (input.hasFooter && input.footerContentHeight < 0) return false;
	return true;
}
