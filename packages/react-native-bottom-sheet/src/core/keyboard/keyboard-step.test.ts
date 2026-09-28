import { describe, expect, test } from "bun:test";
import { keyboardStep } from "./keyboard-step";

const base = {
	behavior: "extend",
	blurBehavior: "restore",
	progress: 0,
	previousProgress: 0,
	owned: true,
	previousOwned: true,
	applied: false,
	sheetOpen: true,
} as const;

describe("keyboardStep", () => {
	test("applies on the first frame the keyboard rises for an owned input", () => {
		expect(keyboardStep({ ...base, progress: 0.1 })).toBe("apply");
	});

	test("applies once — a rising keyboard already applied for is left alone", () => {
		expect(keyboardStep({ ...base, progress: 0.5, previousProgress: 0.1, applied: true })).toBe(null);
	});

	test("applies when ownership arrives a frame late, mid-rise", () => {
		expect(keyboardStep({ ...base, progress: 0.4, previousProgress: 0.4, previousOwned: false })).toBe("apply");
	});

	test("applies when focus moves into the sheet under a keyboard that is already up", () => {
		expect(keyboardStep({ ...base, progress: 1, previousProgress: 1, previousOwned: false })).toBe("apply");
	});

	test("restores when the keyboard starts down", () => {
		expect(keyboardStep({ ...base, progress: 0.9, previousProgress: 1, applied: true })).toBe("restore");
	});

	test("restores when focus leaves the sheet under a keyboard that stays up", () => {
		expect(keyboardStep({ ...base, progress: 1, previousProgress: 1, owned: false, applied: true })).toBe("restore");
	});

	test("an interactive dismiss that turns back re-applies", () => {
		expect(keyboardStep({ ...base, progress: 0.6, previousProgress: 0.4, applied: false })).toBe("apply");
	});

	test("blur behaviour none never restores, and clears the record so the next rise applies again", () => {
		expect(keyboardStep({ ...base, blurBehavior: "none", progress: 0.9, previousProgress: 1, applied: true })).toBe(
			"release"
		);
	});

	test("interactive and none never apply — the lift is a derivation, not a snap", () => {
		expect(keyboardStep({ ...base, behavior: "interactive", progress: 0.1 })).toBe(null);
		expect(keyboardStep({ ...base, behavior: "none", progress: 0.1 })).toBe(null);
	});

	test("a keyboard nobody owns does nothing", () => {
		expect(keyboardStep({ ...base, progress: 0.1, owned: false, previousOwned: false })).toBe(null);
	});

	test("a closed sheet never snaps for a keyboard", () => {
		expect(keyboardStep({ ...base, progress: 0.1, sheetOpen: false })).toBe(null);
	});

	test("a keyboard that falls without anything applied is nothing to restore", () => {
		expect(keyboardStep({ ...base, progress: 0.5, previousProgress: 0.6 })).toBe(null);
	});
});
