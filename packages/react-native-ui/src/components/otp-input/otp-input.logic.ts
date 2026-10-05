/**
 * The pure half of `OtpInput`: what a keystroke, a paste or an autofill is allowed to leave in the
 * field, which cell is active, when the code counts as complete, and what a screen reader hears.
 *
 * Free of React Native imports so `bun test` reaches every decision — see AGENTS.md.
 */

/** Which characters a cell takes. A `RegExp` tests one character at a time. */
export type OtpPattern = "digits" | "alphanumeric" | "alphabetic" | RegExp;

export const OTP_DEFAULT_LENGTH = 6;
export const OTP_MIN_LENGTH = 1;
export const OTP_MAX_LENGTH = 12;

/** What a filled cell shows while masked. */
export const OTP_MASK_CHAR = "•";

/** The accessible name when neither the caller nor an enclosing `Field.Label` gives one. */
export const OTP_DEFAULT_LABEL = "Verification code";

const NAMED_PATTERNS: Record<Exclude<OtpPattern, RegExp>, RegExp> = {
	digits: /^[0-9]$/,
	alphanumeric: /^[0-9A-Za-z]$/,
	alphabetic: /^[A-Za-z]$/,
};

/**
 * Whitespace of every kind plus the zero-width characters an SMS or a copied web page carries
 * invisibly — zero-width space, non-joiner, joiner, word joiner and the byte-order mark.
 */
const INVISIBLE = /[\s​-‍⁠﻿]/gu;

/** The number of cells, clamped to 1..12. A fraction rounds down; a non-number takes the default. */
export function clampOtpLength(length: number | undefined): number {
	if (length === undefined || !Number.isFinite(length)) return OTP_DEFAULT_LENGTH;
	return Math.min(OTP_MAX_LENGTH, Math.max(OTP_MIN_LENGTH, Math.floor(length)));
}

/**
 * Whether one character is allowed in a cell.
 *
 * Anything that is not exactly one code point is rejected, whatever the pattern — a custom
 * `RegExp` such as `/[A-Z]+/` would otherwise accept a whole word as one cell. A caller's `RegExp`
 * is re-created without its `g` and `y` flags, which make `test` stateful through `lastIndex` and
 * would answer alternately for the same character.
 */
export function charMatches(char: string, pattern: OtpPattern): boolean {
	if (Array.from(char).length !== 1) return false;
	if (typeof pattern === "string") return NAMED_PATTERNS[pattern].test(char);
	const stateless = new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ""));
	return stateless.test(char);
}

export type SanitizeOtpOptions = {
	pattern: OtpPattern;
	length: number;
	uppercase: boolean;
};

/**
 * What a raw `onChangeText` value becomes: normalised, filtered one character at a time, cut to
 * length.
 *
 * NFKC first, which folds full-width digits and letters (`１２３`) to ASCII — a Japanese or Chinese
 * IME types those, and a digit is a digit. Then invisible characters go, then each character is
 * uppercased (when asked) before it is matched, so a capitals-only `RegExp` still takes a lowercase
 * keyboard. There are no heuristics: `G-123456` with an alphanumeric pattern is `G12345`, not the
 * six digits a human would pick out. Guessing which run is "the code" is the caller's business.
 */
export function sanitizeOtp(raw: string, { pattern, length, uppercase }: SanitizeOtpOptions): string {
	const max = clampOtpLength(length);
	const cleaned = raw.normalize("NFKC").replace(INVISIBLE, "");
	let out = "";
	for (const original of cleaned) {
		const char = uppercase ? original.toUpperCase() : original;
		if (!charMatches(char, pattern)) continue;
		out += char;
		if (Array.from(out).length >= max) break;
	}
	return out;
}

/** Whether typed letters are uppercased. Defaults on for every pattern but `digits`. */
export function resolveUppercase(pattern: OtpPattern, autoCapitalize: boolean | undefined): boolean {
	return autoCapitalize ?? pattern !== "digits";
}

/**
 * The cell drawn as focused: the next empty one, or the last when the code is full. `null` while
 * the field is not focused.
 */
export function resolveActiveIndex(valueLength: number, length: number, isFocused: boolean): number | null {
	if (!isFocused) return null;
	return Math.min(valueLength, length - 1);
}

/** Everything one cell needs to draw itself. */
export type OtpSlotState = {
	index: number;
	/** The character in the cell, unmasked. `""` while empty. */
	char: string;
	isFilled: boolean;
	/** Drawn with the focus border. */
	isActive: boolean;
	/** Holds the blinking caret: active, and empty. A full code has no caret. */
	isCaret: boolean;
};

export function resolveSlotState(
	value: string,
	index: number,
	{ isFocused, length }: { isFocused: boolean; length: number }
): OtpSlotState {
	const chars = Array.from(value);
	const char = chars[index] ?? "";
	const isFilled = char !== "";
	const isActive = resolveActiveIndex(chars.length, length, isFocused) === index;
	return { char, index, isActive, isCaret: isActive && !isFilled, isFilled };
}

/**
 * Whether this change completes the code: from short of `length` to exactly `length`.
 *
 * A transition, not a state, so a full code that re-renders never fires twice, a paste of a whole
 * code fires once, and a deletion re-arms it.
 */
export function shouldFireComplete(prev: string, next: string, length: number): boolean {
	return Array.from(prev).length < length && Array.from(next).length === length;
}

/**
 * The cell indices, split into groups of `groupSize` — what the default anatomy draws, with a
 * separator between each group. A remainder lands in the last group; a missing, zero, negative or
 * non-finite `groupSize` is one group.
 */
export function buildLayout(length: number, groupSize: number | undefined): number[][] {
	const total = clampOtpLength(length);
	const indices = Array.from({ length: total }, (_, index) => index);
	if (groupSize === undefined || !Number.isFinite(groupSize) || groupSize < 1) return [indices];
	const size = Math.floor(groupSize);
	const groups: number[][] = [];
	for (let start = 0; start < total; start += size) groups.push(indices.slice(start, start + size));
	return groups;
}

/** What a cell shows: the mask for a filled cell while masked, the character otherwise. */
export function maskChar(char: string, isMasked: boolean): string {
	return isMasked && char !== "" ? OTP_MASK_CHAR : char;
}

export type OtpKeyboard = "number-pad" | "default";

/** The number pad for `digits`; the full keyboard for anything a letter can satisfy. */
export function resolveKeyboard(pattern: OtpPattern): OtpKeyboard {
	return pattern === "digits" ? "number-pad" : "default";
}

export type OtpAutofill = "one-time-code" | "sms-otp" | "off";

/**
 * The `autoComplete` hint per platform: iOS's QuickType bar offers a code from Messages for
 * `one-time-code`, Android's autofill service offers one for `sms-otp`.
 */
export function resolveAutofill(platform: string): OtpAutofill {
	if (platform === "ios") return "one-time-code";
	if (platform === "android") return "sms-otp";
	return "off";
}

function unitOf(pattern: OtpPattern): "digit" | "character" {
	return pattern === "digits" ? "digit" : "character";
}

/**
 * What a screen reader reads as the field's value.
 *
 * Unmasked, the characters spaced out so each is read alone — "1 2 3", never "one hundred and
 * twenty-three". Masked, a count, because reading a PIN aloud defeats the mask. Empty is counted
 * either way, so the reader hears how long the code is rather than nothing.
 */
export function resolveAccessibilityValue({
	value,
	length,
	isMasked,
	pattern,
}: {
	value: string;
	length: number;
	isMasked: boolean;
	pattern: OtpPattern;
}): string {
	const chars = Array.from(value);
	if (isMasked || chars.length === 0) return `${chars.length} of ${length} ${unitOf(pattern)}s entered`;
	return chars.join(" ");
}

/** The hint that tells a screen-reader user what to type. */
export function resolveAccessibilityHint(length: number, pattern: OtpPattern): string {
	return `Enter the ${length} ${unitOf(pattern)} code`;
}

/** The accessible name: the caller's, else the enclosing `Field.Label`'s text, else the default. */
export function resolveAccessibilityLabel(own: string | undefined, fieldLabel: string | null | undefined): string {
	return own ?? fieldLabel ?? OTP_DEFAULT_LABEL;
}

export type OtpStateAxes = { isInvalid: boolean; isDisabled: boolean };

/**
 * The two state axes, nearest source first: the component's own prop, then an enclosing `Field`.
 * Both are `??` chains, so an explicit `false` opts one control out of an invalid field.
 */
export function resolveOtpAxes({
	own,
	field,
}: {
	own: { isInvalid?: boolean; isDisabled?: boolean };
	field: OtpStateAxes | null;
}): OtpStateAxes {
	return {
		isDisabled: own.isDisabled ?? field?.isDisabled ?? false,
		isInvalid: own.isInvalid ?? field?.isInvalid ?? false,
	};
}
