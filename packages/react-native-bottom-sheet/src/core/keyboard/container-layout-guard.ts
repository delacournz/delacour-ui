export type ContainerLayoutInput = {
	/** The container height on record; `UNMEASURED` before the first layout. */
	prev: number;
	/** The height `onLayout` just reported. */
	next: number;
	/** The keyboard within the container, positive. */
	keyboardHeight: number;
	/** keyboard-controller's `progress`. */
	progress: number;
};

/** Slack for a keyboard height rounded differently by the two sources. */
const TOLERANCE = 2;

/**
 * Whether a container `onLayout` is a real resize or Android's `adjustResize`
 * shrinking the window under a keyboard the sheet is already lifting for.
 *
 * Accepting the second would count the keyboard twice: once as the lift, once
 * as a smaller container with every percent detent re-derived against it.
 * So while the keyboard is in play, a shrink no larger than the keyboard is
 * refused. A shrink larger than that — a rotation, a split view — is real
 * whatever the keyboard is doing, and growth and first measurement always
 * land.
 */
export function acceptContainerLayout(input: ContainerLayoutInput): boolean {
	if (input.prev < 0 || input.next >= input.prev) return true;
	if (!(input.progress > 0) || !(input.keyboardHeight > 0)) return true;
	const shrink = input.prev - input.next;
	return shrink > input.keyboardHeight + TOLERANCE;
}
