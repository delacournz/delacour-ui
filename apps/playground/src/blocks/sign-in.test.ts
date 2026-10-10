import { describe, expect, test } from "bun:test";
import { canSubmitSignIn, emailError, passwordError } from "./sign-in";

describe("emailError", () => {
	test("is silent while empty", () => expect(emailError("")).toBeUndefined());
	test("flags a missing domain", () => expect(emailError("ada@")).toBeDefined());
	test("flags a missing at", () => expect(emailError("ada.example.com")).toBeDefined());
	test("accepts an address", () => expect(emailError("ada@example.com")).toBeUndefined());
});

describe("passwordError", () => {
	test("is silent while empty", () => expect(passwordError("")).toBeUndefined());
	test("wants eight characters", () => {
		expect(passwordError("short")).toBeDefined();
		expect(passwordError("long-enough")).toBeUndefined();
	});
});

describe("canSubmitSignIn", () => {
	test("needs both fields valid and filled", () => {
		expect(canSubmitSignIn("", "")).toBe(false);
		expect(canSubmitSignIn("ada@example.com", "short")).toBe(false);
		expect(canSubmitSignIn("ada@example.com", "long-enough")).toBe(true);
	});
});
