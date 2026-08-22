import { describe, expect, test } from "bun:test";
import {
	PRESSABLE_FEEDBACK,
	PRESSABLE_FEEDBACK_FALLBACK,
	PRESSABLE_FEEDBACKS,
	resolvePressedState,
} from "./pressable.variants";

describe("PRESSABLE_FEEDBACK", () => {
	test("covers every named feedback", () => {
		for (const feedback of PRESSABLE_FEEDBACKS) {
			expect(PRESSABLE_FEEDBACK[feedback]).toBeDefined();
		}
	});

	test("gives every named feedback a distinct pair", () => {
		const seen = new Set(PRESSABLE_FEEDBACKS.map((feedback) => JSON.stringify(PRESSABLE_FEEDBACK[feedback])));
		expect(seen.size).toBe(PRESSABLE_FEEDBACKS.length);
	});

	// 1 is the neutral value on either axis, so a single-axis mode leaves the
	// other one alone rather than nudging it.
	test("scale shrinks without dimming", () => {
		expect(PRESSABLE_FEEDBACK.scale.opacity).toBe(1);
		expect(PRESSABLE_FEEDBACK.scale.scale).toBeLessThan(1);
	});

	test("fade dims without scaling", () => {
		expect(PRESSABLE_FEEDBACK.fade.scale).toBe(1);
		expect(PRESSABLE_FEEDBACK.fade.opacity).toBeLessThan(1);
	});

	test("none moves neither axis", () => {
		expect(PRESSABLE_FEEDBACK.none).toEqual({ opacity: 1, scale: 1 });
	});

	// The load-bearing one: `scale-fade` is the union of the two single-axis
	// modes, not a third set of numbers. Tuning `scale` or `fade` has to carry
	// through, or the name stops describing what the mode does.
	test("scale-fade takes each axis from the mode that owns it", () => {
		expect(PRESSABLE_FEEDBACK["scale-fade"]).toEqual({
			opacity: PRESSABLE_FEEDBACK.fade.opacity,
			scale: PRESSABLE_FEEDBACK.scale.scale,
		});
	});

	test("every mode stays within the range the press interpolates over", () => {
		for (const feedback of PRESSABLE_FEEDBACKS) {
			const { opacity, scale } = PRESSABLE_FEEDBACK[feedback];
			expect(opacity).toBeGreaterThan(0);
			expect(opacity).toBeLessThanOrEqual(1);
			expect(scale).toBeGreaterThan(0);
			expect(scale).toBeLessThanOrEqual(1);
		}
	});
});

describe("resolvePressedState", () => {
	test("maps each named feedback to its pair", () => {
		for (const feedback of PRESSABLE_FEEDBACKS) {
			expect(resolvePressedState(feedback, undefined, undefined)).toEqual(PRESSABLE_FEEDBACK[feedback]);
		}
	});

	// Naming the fallback would either change what a bare Pressable has always
	// done or make `scale-fade` fade less than `fade`. It stays unnamed instead.
	test("falls back to the pair a bare pressable has always used", () => {
		expect(resolvePressedState(undefined, undefined, undefined)).toEqual(PRESSABLE_FEEDBACK_FALLBACK);
		expect(PRESSABLE_FEEDBACK_FALLBACK).toEqual({ opacity: 0.9, scale: 0.97 });
	});

	test("an explicit value beats the fallback on its own axis", () => {
		expect(resolvePressedState(undefined, 1, undefined)).toEqual({
			opacity: PRESSABLE_FEEDBACK_FALLBACK.opacity,
			scale: 1,
		});
		expect(resolvePressedState(undefined, undefined, 1)).toEqual({
			opacity: 1,
			scale: PRESSABLE_FEEDBACK_FALLBACK.scale,
		});
	});

	test("an explicit value beats a named feedback on its own axis", () => {
		expect(resolvePressedState("scale-fade", undefined, 0.2)).toEqual({
			opacity: 0.2,
			scale: PRESSABLE_FEEDBACK["scale-fade"].scale,
		});
		expect(resolvePressedState("none", 0.5, undefined)).toEqual({ opacity: 1, scale: 0.5 });
	});

	test("both explicit values leave nothing of the named feedback", () => {
		expect(resolvePressedState("scale", 0.5, 0.5)).toEqual({ opacity: 0.5, scale: 0.5 });
	});

	// 0 is a legitimate value on either axis and must not read as "unset".
	test("treats an explicit zero as a value, not an absence", () => {
		expect(resolvePressedState("scale", 0, 0)).toEqual({ opacity: 0, scale: 0 });
	});
});
