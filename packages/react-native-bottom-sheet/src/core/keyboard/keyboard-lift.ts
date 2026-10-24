import type { KeyboardBehavior, KeyboardLiftLimit } from "../sheet.types";

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
	/** The keyboard-free height the lift sits on. Read only with `ceiling`. */
	base?: number;
	/** The height the lift may not carry `base` past — see `keyboardCeiling`. */
	ceiling?: number;
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
	if (!(lift > 0)) return 0;
	if (input.ceiling === undefined) return lift;
	const room = input.ceiling - (input.base ?? 0);
	if (!(room > 0)) return 0;
	return lift < room ? lift : room;
}

export type KeyboardCeilingInput = {
	limit: KeyboardLiftLimit;
	dynamicSizing: boolean;
	maxDynamicContentSize: number | undefined;
	/** The container's available height. */
	maxHeight: number;
	/** The highest snap point; read only under `highestSnapPoint`. */
	highest: number;
};

/**
 * The height a keyboard may lift the sheet to.
 *
 * The container's top, unless `limit` is `maxDynamicContentSize` and the sheet
 * sizes to its content under that cap: then the lift stops at the cap and the
 * keyboard covers the sheet's bottom instead, the body shrinking by it as
 * always. `highestSnapPoint` does the same at the highest snap point, explicit
 * or dynamic, so a sheet opened there holds still while a keyboard comes and
 * goes. Decided on the UI thread, in the frame the keyboard moves — a caller
 * shrinking the cap from a JS keyboard event lands a few frames late, and the
 * sheet overshoots to the container's top before settling.
 */
export function keyboardCeiling(input: KeyboardCeilingInput): number {
	"worklet";
	if (input.limit === "highestSnapPoint") {
		return input.highest > 0 && input.highest < input.maxHeight ? input.highest : input.maxHeight;
	}
	const cap = input.maxDynamicContentSize;
	if (input.limit !== "maxDynamicContentSize" || !input.dynamicSizing || cap === undefined) return input.maxHeight;
	const bounded = cap > 0 ? cap : 0;
	return bounded < input.maxHeight ? bounded : input.maxHeight;
}
