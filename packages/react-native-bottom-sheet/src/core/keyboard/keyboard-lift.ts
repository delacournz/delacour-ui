import type { KeyboardBehavior } from "../sheet.types";

/**
 * How much of the keyboard overlaps the sheet's container.
 *
 * keyboard-controller reports `height` as a **negative** number of pixels from
 * the window's bottom edge. A container whose bottom sits
 * `containerBottomOffset` above that edge is overlapped by that much less.
 */
export function keyboardInContainer(rawKeyboardHeight: number, containerBottomOffset: number): number {
	"worklet";
	const offset = containerBottomOffset > 0 ? containerBottomOffset : 0;
	const overlap = -rawKeyboardHeight - offset;
	return overlap > 0 ? overlap : 0;
}

export type KeyboardLiftInput = {
	/** The keyboard the sheet owns, positive, already reduced to the container. */
	keyboardHeight: number;
	/** keyboard-controller's `progress`, 0 closed through 1 open. */
	progress: number;
	/** The safe-area band under an attached sheet; zero when detached. */
	band: number;
	behavior: KeyboardBehavior;
	/** A detached sheet's resting bottom — pixels it already floats above the edge. */
	gapBelow: number;
};

/**
 * The extra height a keyboard adds on top of `base`.
 *
 * Only `interactive` and `extend` lift. The sheet already spends `band`
 * pixels on the safe area under the footer, and those pixels are the
 * keyboard's now, so they come off the lift in step with `progress`; a
 * detached sheet's gap comes off the same way. That subtraction is what holds
 * `footerTop` still for the whole keyboard animation — see `footer/footer-top`.
 */
export function keyboardLift(input: KeyboardLiftInput): number {
	"worklet";
	if (input.behavior !== "interactive" && input.behavior !== "extend") return 0;

	const progress = input.progress < 0 ? 0 : input.progress > 1 ? 1 : input.progress;
	const band = input.band > 0 ? input.band : 0;
	const gap = input.gapBelow > 0 ? input.gapBelow : 0;
	const lift = input.keyboardHeight - band * progress - gap;
	return lift > 0 ? lift : 0;
}
