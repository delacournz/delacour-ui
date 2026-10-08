import { describe, expect, test } from "bun:test";
import { applyOtpInput, isOtpComplete, OTP_LENGTH, otpCode } from "./otp";

const empty = () => Array.from({ length: OTP_LENGTH }, () => "");

describe("applyOtpInput", () => {
	test("a digit fills its box and moves focus on", () => {
		const next = applyOtpInput(empty(), 0, "4");
		expect(next.digits[0]).toBe("4");
		expect(next.focus).toBe(1);
	});

	test("a non-digit is dropped and focus stays", () => {
		const next = applyOtpInput(empty(), 2, "x");
		expect(next.digits).toEqual(empty());
		expect(next.focus).toBe(2);
	});

	test("clearing a box steps focus back", () => {
		const start = applyOtpInput(empty(), 0, "4").digits;
		const next = applyOtpInput(start, 1, "");
		expect(next.focus).toBe(0);
	});

	test("a pasted code spreads across the boxes from the first", () => {
		const next = applyOtpInput(empty(), 0, "123456");
		expect(next.digits).toEqual(["1", "2", "3", "4", "5", "6"]);
		expect(next.focus).toBe(OTP_LENGTH - 1);
	});

	test("a paste with separators keeps only the digits", () => {
		const next = applyOtpInput(empty(), 0, "12 34-56");
		expect(otpCode(next.digits)).toBe("123456");
	});

	test("the last box keeps focus", () => {
		const next = applyOtpInput(empty(), OTP_LENGTH - 1, "9");
		expect(next.focus).toBe(OTP_LENGTH - 1);
	});
});

describe("isOtpComplete", () => {
	test("needs every box", () => {
		expect(isOtpComplete(empty())).toBe(false);
		expect(isOtpComplete(["1", "2", "3", "4", "5", "6"])).toBe(true);
	});
});
