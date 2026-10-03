import { describe, expect, test } from "bun:test";
import { calmMotion } from "./calm-motion";

describe("calmMotion", () => {
	test("moves when neither the OS nor the app asks for stillness", () => {
		expect(calmMotion({ isReduceMotion: false, isMotionCalm: false })).toBe(false);
	});

	test("holds still under the OS reduce-motion setting", () => {
		expect(calmMotion({ isReduceMotion: true, isMotionCalm: false })).toBe(true);
	});

	test("holds still when the app asks, whatever the OS says", () => {
		expect(calmMotion({ isReduceMotion: false, isMotionCalm: true })).toBe(true);
		expect(calmMotion({ isReduceMotion: true, isMotionCalm: true })).toBe(true);
	});
});
