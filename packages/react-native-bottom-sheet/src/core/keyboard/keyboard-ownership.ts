import type { KeyboardScope } from "../sheet.types";

export type KeyboardOwnerInput = {
	scope: KeyboardScope;
	/** A `useBottomSheetTextInput` field holds focus. */
	registeredFocused: boolean;
	/** The focused input's frame lies inside the sheet — `isInputInsideSheet`. */
	inputInside: boolean;
	/** keyboard-controller reports a focused input at all; `false` between a blur and the next focus. */
	inputFocused: boolean;
	/** keyboard-controller's `progress`, 0 closed through 1 open. */
	progress: number;
	/** What this resolved to last frame. */
	previousOwned: boolean;
};

/**
 * Whether the keyboard on screen is the sheet's to lift for.
 *
 * A candidate — a registered field, or under `inside` any focused input whose
 * frame overlaps the sheet — claims it outright, up or down. A focused input
 * that is not a candidate is someone else's, and the sheet lets go at once.
 * With no focused input at all the answer is sticky: a keyboard the sheet
 * owned stays owned until `progress` is back at zero. That covers the two
 * ways the signal lies mid-transition — the focused-input layout can land a
 * frame after `progress` starts moving, and it goes null the moment a field
 * blurs, while the keyboard takes another quarter second to leave. Letting go
 * early would drop the sheet by the lift and then have it chase the keyboard
 * down.
 */
export function resolveKeyboardOwner(input: KeyboardOwnerInput): boolean {
	"worklet";
	if (input.scope === "always") return true;
	const candidate =
		input.scope === "registered" ? input.registeredFocused : input.registeredFocused || input.inputInside;
	if (candidate) return true;
	if (input.inputFocused) return false;
	return input.previousOwned && input.progress > 0;
}
