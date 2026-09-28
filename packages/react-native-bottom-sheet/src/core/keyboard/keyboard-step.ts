import type { KeyboardBehavior, KeyboardBlurBehavior } from "../sheet.types";

export type KeyboardStepInput = {
	behavior: KeyboardBehavior;
	blurBehavior: KeyboardBlurBehavior;
	/** keyboard-controller's `progress` this frame and last. */
	progress: number;
	previousProgress: number;
	/** `resolveKeyboardOwner` this frame and last. */
	owned: boolean;
	previousOwned: boolean;
	/** Whether the behaviour's snap has run for the keyboard currently up. */
	applied: boolean;
	/** The sheet is above its closed height, settled or on the way. */
	sheetOpen: boolean;
};

/**
 * What the behaviour reaction does this frame.
 *
 * `apply` — snap for the keyboard: `extend` to the highest detent,
 * `fillParent` to the container. `restore` — the keyboard is leaving or focus
 * left the sheet, and `keyboardBlurBehavior: "restore"` sends the sheet back
 * to the detent it held before. `release` — the same moment under
 * `blurBehavior: "none"`: nothing moves, but the record clears so the next
 * rise applies again. `null` — nothing.
 */
export type KeyboardStep = "apply" | "restore" | "release" | null;

/**
 * The show/hide decision, as a pure function of two consecutive samples.
 *
 * `interactive` and `none` never snap — one lifts by derivation, the other
 * does nothing — so they always return `null`. For the two that do, a rise
 * (`progress` climbing, or ownership arriving under a keyboard already up)
 * applies once, and a fall (`progress` dropping, or ownership leaving)
 * restores once; an interactive dismiss that turns back mid-way applies
 * again, because the fall already restored.
 */
export function keyboardStep(input: KeyboardStepInput): KeyboardStep {
	"worklet";
	if (input.behavior !== "extend" && input.behavior !== "fillParent") return null;

	const rising = input.progress > input.previousProgress || (input.owned && !input.previousOwned);
	const falling = input.progress < input.previousProgress || (!input.owned && input.previousOwned);

	if (input.applied) {
		if (!falling) return null;
		return input.blurBehavior === "restore" ? "restore" : "release";
	}
	if (!input.owned || !input.sheetOpen || input.progress <= 0) return null;
	return rising ? "apply" : null;
}
