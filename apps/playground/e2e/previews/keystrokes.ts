/**
 * What a capture types, as taps on the on-screen keyboard — pure, so the plan is testable apart from a device.
 *
 * warden's `type` and `press` send USB HID key events, which iOS reads as a hardware keyboard: after the first one
 * it stops raising the software keyboard for every later focus, so a clip that typed once recorded every following
 * field with no keyboard on screen and a sheet sized for a keyboard that never came. A demo is a picture of the app
 * as a person on a phone sees it, so a capture taps the keys instead.
 */
import type { KeyName } from "./capture";

export type Keystroke =
	| { kind: "letter"; label: string; shifted: boolean }
	| { kind: "space" }
	| { kind: "symbol"; label: string };

const LETTER = /^[a-z]$/i;

/** One keystroke per code point: a lowercase key, the same key behind shift, the space bar, or a symbol. */
export function planKeystrokes(text: string): Keystroke[] {
	return Array.from(text, (char): Keystroke => {
		if (char === " ") return { kind: "space" };
		if (!LETTER.test(char)) return { kind: "symbol", label: char };
		const label = char.toLowerCase();
		return { kind: "letter", label, shifted: char !== label };
	});
}

/** The return key's name follows the field's `returnKeyType`, so it is matched by every name iOS gives it. */
export const RETURN_KEY_NAME = /^(return|search|go|done|next|send|join|route|continue|google|yahoo|emergency call)$/i;

export type SoftKey = { kind: "id"; id: string } | { kind: "return"; name: RegExp };

/** The on-screen key a named key press is, or undefined when the software keyboard has none (Tab, arrows, Escape). */
export function softKeyFor(key: KeyName): SoftKey | undefined {
	switch (key) {
		case "Backspace":
		case "Delete":
			return { kind: "id", id: "delete" };
		case "Space":
			return { kind: "id", id: "space" };
		case "Enter":
			return { kind: "return", name: RETURN_KEY_NAME };
		default:
			return undefined;
	}
}
