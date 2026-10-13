import { describe, expect, test } from "bun:test";
import {
	buildLayout,
	charMatches,
	clampOtpLength,
	maskChar,
	OTP_DEFAULT_LABEL,
	OTP_DEFAULT_LENGTH,
	OTP_MASK_CHAR,
	OTP_MAX_LENGTH,
	OTP_MIN_LENGTH,
	resolveAccessibilityHint,
	resolveAccessibilityLabel,
	resolveAccessibilityValue,
	resolveActiveIndex,
	resolveAutofill,
	resolveKeyboard,
	resolveOtpAxes,
	resolveSlotState,
	resolveUppercase,
	sanitizeOtp,
	shouldFireComplete,
} from "./otp-input.logic";

describe("clampOtpLength", () => {
	test("defaults to six", () => {
		expect(clampOtpLength(undefined)).toBe(OTP_DEFAULT_LENGTH);
		expect(OTP_DEFAULT_LENGTH).toBe(6);
	});

	test("clamps into 1..12 and rounds a fraction down", () => {
		expect(clampOtpLength(0)).toBe(OTP_MIN_LENGTH);
		expect(clampOtpLength(-4)).toBe(OTP_MIN_LENGTH);
		expect(clampOtpLength(40)).toBe(OTP_MAX_LENGTH);
		expect(clampOtpLength(4.8)).toBe(4);
		expect(OTP_MAX_LENGTH).toBe(12);
	});

	test("a non-finite length falls back to the default", () => {
		expect(clampOtpLength(Number.NaN)).toBe(OTP_DEFAULT_LENGTH);
		expect(clampOtpLength(Number.POSITIVE_INFINITY)).toBe(OTP_DEFAULT_LENGTH);
	});
});

describe("charMatches", () => {
	test("digits takes 0-9 only", () => {
		expect(charMatches("7", "digits")).toBe(true);
		expect(charMatches("0", "digits")).toBe(true);
		expect(charMatches("a", "digits")).toBe(false);
		expect(charMatches("-", "digits")).toBe(false);
	});

	test("alphanumeric takes letters and digits, nothing else", () => {
		expect(charMatches("a", "alphanumeric")).toBe(true);
		expect(charMatches("Z", "alphanumeric")).toBe(true);
		expect(charMatches("7", "alphanumeric")).toBe(true);
		expect(charMatches("-", "alphanumeric")).toBe(false);
		expect(charMatches(" ", "alphanumeric")).toBe(false);
	});

	test("alphabetic takes letters only", () => {
		expect(charMatches("q", "alphabetic")).toBe(true);
		expect(charMatches("Q", "alphabetic")).toBe(true);
		expect(charMatches("4", "alphabetic")).toBe(false);
	});

	test("a RegExp tests one character", () => {
		const hex = /[0-9A-F]/;
		expect(charMatches("B", hex)).toBe(true);
		expect(charMatches("G", hex)).toBe(false);
	});

	test("anything but exactly one character is rejected, whatever the pattern", () => {
		expect(charMatches("12", "digits")).toBe(false);
		expect(charMatches("", "digits")).toBe(false);
		expect(charMatches("AB", /[A-Z]+/)).toBe(false);
	});

	test("a global RegExp gives the same answer every call", () => {
		const sticky = /[0-9]/g;
		expect(charMatches("1", sticky)).toBe(true);
		expect(charMatches("2", sticky)).toBe(true);
		expect(charMatches("3", sticky)).toBe(true);
	});
});

describe("sanitizeOtp", () => {
	const digits = { length: 6, pattern: "digits", uppercase: false } as const;

	test("drops separators and spaces in digits mode", () => {
		expect(sanitizeOtp("12 34-56", digits)).toBe("123456");
	});

	test("nothing that matches yields an empty string", () => {
		expect(sanitizeOtp("..", digits)).toBe("");
		expect(sanitizeOtp("", digits)).toBe("");
	});

	test("truncates to length", () => {
		expect(sanitizeOtp("1234567890", digits)).toBe("123456");
	});

	test("uppercases when asked", () => {
		expect(sanitizeOtp("ab12", { length: 6, pattern: "alphanumeric", uppercase: true })).toBe("AB12");
	});

	test("keeps case when not asked", () => {
		expect(sanitizeOtp("ab12", { length: 6, pattern: "alphanumeric", uppercase: false })).toBe("ab12");
	});

	test("strips whitespace, newlines and zero-width characters", () => {
		expect(sanitizeOtp("1\n2\t3​4‌5﻿6", digits)).toBe("123456");
	});

	test("applies no heuristics to a prefixed code — it is filtered, then cut", () => {
		expect(sanitizeOtp("G-123456", { length: 6, pattern: "alphanumeric", uppercase: true })).toBe("G12345");
	});

	test("normalises full-width digits to ASCII", () => {
		expect(sanitizeOtp("１２３", digits)).toBe("123");
	});

	test("uppercases before matching, so a capitals-only RegExp takes lowercase input", () => {
		expect(sanitizeOtp("ab", { length: 4, pattern: /[A-Z]/, uppercase: true })).toBe("AB");
		expect(sanitizeOtp("ab", { length: 4, pattern: /[A-Z]/, uppercase: false })).toBe("");
	});

	test("clamps the length it is handed", () => {
		expect(sanitizeOtp("1234567890123456", { ...digits, length: 99 })).toBe("123456789012");
	});
});

describe("resolveUppercase", () => {
	test("defaults on for letter patterns and off for digits", () => {
		expect(resolveUppercase("digits", undefined)).toBe(false);
		expect(resolveUppercase("alphanumeric", undefined)).toBe(true);
		expect(resolveUppercase("alphabetic", undefined)).toBe(true);
		expect(resolveUppercase(/[a-z]/, undefined)).toBe(true);
	});

	test("an explicit choice wins", () => {
		expect(resolveUppercase("alphanumeric", false)).toBe(false);
		expect(resolveUppercase("digits", true)).toBe(true);
	});
});

describe("resolveActiveIndex", () => {
	test("unfocused has no active cell", () => {
		expect(resolveActiveIndex(3, 6, false)).toBeNull();
	});

	test("focused points at the next empty cell", () => {
		expect(resolveActiveIndex(0, 6, true)).toBe(0);
		expect(resolveActiveIndex(3, 6, true)).toBe(3);
	});

	test("full keeps the last cell active", () => {
		expect(resolveActiveIndex(6, 6, true)).toBe(5);
	});
});

describe("resolveSlotState", () => {
	test("a filled cell carries its character", () => {
		expect(resolveSlotState("12", 1, { isFocused: true, length: 6 })).toEqual({
			char: "2",
			index: 1,
			isActive: false,
			isCaret: false,
			isFilled: true,
		});
	});

	test("the first empty cell is active and holds the caret while focused", () => {
		expect(resolveSlotState("12", 2, { isFocused: true, length: 6 })).toEqual({
			char: "",
			index: 2,
			isActive: true,
			isCaret: true,
			isFilled: false,
		});
	});

	test("no caret and no active cell while unfocused", () => {
		const state = resolveSlotState("12", 2, { isFocused: false, length: 6 });
		expect(state.isActive).toBe(false);
		expect(state.isCaret).toBe(false);
	});

	test("full: the last cell stays active, with no caret", () => {
		const state = resolveSlotState("123456", 5, { isFocused: true, length: 6 });
		expect(state).toEqual({ char: "6", index: 5, isActive: true, isCaret: false, isFilled: true });
	});

	test("later empty cells are neither active nor carets", () => {
		const state = resolveSlotState("1", 4, { isFocused: true, length: 6 });
		expect(state.isActive).toBe(false);
		expect(state.isCaret).toBe(false);
		expect(state.isFilled).toBe(false);
	});
});

describe("shouldFireComplete", () => {
	test("fires on the transition to full", () => {
		expect(shouldFireComplete("12345", "123456", 6)).toBe(true);
	});

	test("does not fire again while it stays full", () => {
		expect(shouldFireComplete("123456", "123456", 6)).toBe(false);
	});

	test("a paste from empty fires once", () => {
		expect(shouldFireComplete("", "123456", 6)).toBe(true);
	});

	test("re-arms after a deletion", () => {
		expect(shouldFireComplete("123456", "12345", 6)).toBe(false);
		expect(shouldFireComplete("12345", "123457", 6)).toBe(true);
	});

	test("a one-cell code completes on its first character", () => {
		expect(shouldFireComplete("", "7", 1)).toBe(true);
	});

	test("anything short of full does not fire", () => {
		expect(shouldFireComplete("1", "12", 6)).toBe(false);
	});
});

describe("buildLayout", () => {
	test("splits into groups of groupSize", () => {
		expect(buildLayout(6, 3)).toEqual([
			[0, 1, 2],
			[3, 4, 5],
		]);
	});

	test("no groupSize is one group", () => {
		expect(buildLayout(6, 0)).toEqual([[0, 1, 2, 3, 4, 5]]);
		expect(buildLayout(6, undefined)).toEqual([[0, 1, 2, 3, 4, 5]]);
	});

	test("a remainder lands in the last group", () => {
		expect(buildLayout(6, 4)).toEqual([
			[0, 1, 2, 3],
			[4, 5],
		]);
	});

	test("groupSize equal to length is one group", () => {
		expect(buildLayout(4, 4)).toEqual([[0, 1, 2, 3]]);
		expect(buildLayout(1, 1)).toEqual([[0]]);
	});

	test("an invalid groupSize is one group", () => {
		expect(buildLayout(4, -2)).toEqual([[0, 1, 2, 3]]);
		expect(buildLayout(4, Number.NaN)).toEqual([[0, 1, 2, 3]]);
	});

	test("clamps the length", () => {
		expect(buildLayout(30, 0)[0]).toHaveLength(OTP_MAX_LENGTH);
		expect(buildLayout(0, 0)).toEqual([[0]]);
	});
});

describe("maskChar", () => {
	test("masks a filled cell", () => {
		expect(maskChar("4", true)).toBe(OTP_MASK_CHAR);
		expect(OTP_MASK_CHAR).toBe("•");
	});

	test("passes through unmasked, and an empty cell stays empty", () => {
		expect(maskChar("4", false)).toBe("4");
		expect(maskChar("", true)).toBe("");
	});
});

describe("resolveKeyboard", () => {
	test("digits gets the number pad", () => {
		expect(resolveKeyboard("digits")).toBe("number-pad");
	});

	test("everything else gets the default keyboard", () => {
		expect(resolveKeyboard("alphanumeric")).toBe("default");
		expect(resolveKeyboard("alphabetic")).toBe("default");
		expect(resolveKeyboard(/[0-9]/)).toBe("default");
	});
});

describe("resolveAutofill", () => {
	test("names the one-time-code hint per platform", () => {
		expect(resolveAutofill("ios")).toBe("one-time-code");
		expect(resolveAutofill("android")).toBe("sms-otp");
		expect(resolveAutofill("web")).toBe("off");
	});
});

describe("resolveAccessibilityValue", () => {
	test("unmasked spells the characters out", () => {
		expect(resolveAccessibilityValue({ isMasked: false, length: 6, pattern: "digits", value: "123" })).toBe("1 2 3");
	});

	test("masked counts instead of reading", () => {
		expect(resolveAccessibilityValue({ isMasked: true, length: 4, pattern: "digits", value: "12" })).toBe(
			"2 of 4 digits entered"
		);
	});

	test("letter patterns count characters", () => {
		expect(resolveAccessibilityValue({ isMasked: true, length: 6, pattern: "alphanumeric", value: "A" })).toBe(
			"1 of 6 characters entered"
		);
	});

	test("empty is counted in both modes rather than read as nothing", () => {
		expect(resolveAccessibilityValue({ isMasked: false, length: 6, pattern: "digits", value: "" })).toBe(
			"0 of 6 digits entered"
		);
		expect(resolveAccessibilityValue({ isMasked: true, length: 6, pattern: "digits", value: "" })).toBe(
			"0 of 6 digits entered"
		);
	});
});

describe("resolveAccessibilityHint", () => {
	test("names the length and the unit", () => {
		expect(resolveAccessibilityHint(6, "digits")).toBe("Enter the 6 digit code");
		expect(resolveAccessibilityHint(8, "alphanumeric")).toBe("Enter the 8 character code");
	});
});

describe("resolveAccessibilityLabel", () => {
	test("own label, then the field's, then the default", () => {
		expect(resolveAccessibilityLabel("PIN", "Code")).toBe("PIN");
		expect(resolveAccessibilityLabel(undefined, "Code")).toBe("Code");
		expect(resolveAccessibilityLabel(undefined, null)).toBe(OTP_DEFAULT_LABEL);
		expect(OTP_DEFAULT_LABEL).toBe("Verification code");
	});
});

describe("resolveOtpAxes", () => {
	test("falls back to calm and enabled", () => {
		expect(resolveOtpAxes({ field: null, own: {} })).toEqual({ isDisabled: false, isInvalid: false });
	});

	test("inherits from the field", () => {
		expect(resolveOtpAxes({ field: { isDisabled: true, isInvalid: true }, own: {} })).toEqual({
			isDisabled: true,
			isInvalid: true,
		});
	});

	test("an explicit false still wins over the field", () => {
		expect(
			resolveOtpAxes({ field: { isDisabled: true, isInvalid: true }, own: { isDisabled: false, isInvalid: false } })
		).toEqual({ isDisabled: false, isInvalid: false });
	});
});
