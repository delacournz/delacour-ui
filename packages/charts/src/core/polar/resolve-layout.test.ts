import { describe, expect, test } from "bun:test";
import type { InnerRadius } from "./polar.types";
import { resolveInnerRadius, resolvePolarLayout } from "./resolve-layout";

describe("resolvePolarLayout", () => {
	test("fits the largest circle the canvas holds, centred", () => {
		const layout = resolvePolarLayout({ canvas: { width: 300, height: 200 } });
		expect(layout.center).toEqual({ x: 150, y: 100 });
		expect(layout.radius).toBe(100);
		expect(layout.innerRadius).toBe(0);
	});

	test("padding shrinks the circle and moves the centre", () => {
		const layout = resolvePolarLayout({ canvas: { width: 300, height: 200 }, padding: { left: 100 } });
		expect(layout.center).toEqual({ x: 200, y: 100 });
		expect(layout.radius).toBe(100);
	});

	test("an explicit size caps the diameter but never exceeds the canvas", () => {
		expect(resolvePolarLayout({ canvas: { width: 300, height: 200 }, size: 100 }).radius).toBe(50);
		expect(resolvePolarLayout({ canvas: { width: 300, height: 200 }, size: 1000 }).radius).toBe(100);
	});

	test("resolves the inner radius against the outer one", () => {
		expect(resolvePolarLayout({ canvas: { width: 200, height: 200 }, innerRadius: "50%" }).innerRadius).toBe(50);
		expect(resolvePolarLayout({ canvas: { width: 200, height: 200 }, innerRadius: 30 }).innerRadius).toBe(30);
	});

	test("a zero or over-padded canvas yields a zero radius rather than a negative one", () => {
		expect(resolvePolarLayout({ canvas: { width: 0, height: 0 } }).radius).toBe(0);
		expect(resolvePolarLayout({ canvas: { width: 50, height: 50 }, padding: 40 }).radius).toBe(0);
	});
});

describe("resolveInnerRadius", () => {
	test("a number is taken as points", () => {
		expect(resolveInnerRadius(40, 100)).toBe(40);
	});

	test("a percentage is of the outer radius", () => {
		expect(resolveInnerRadius("60%", 100)).toBe(60);
	});

	test("clamps into [0, radius)", () => {
		expect(resolveInnerRadius(-5, 100)).toBe(0);
		expect(resolveInnerRadius(150, 100)).toBeLessThan(100);
		expect(resolveInnerRadius(150, 100)).toBeGreaterThanOrEqual(0);
		expect(resolveInnerRadius("120%", 100)).toBeLessThan(100);
	});

	test("an unreadable percentage is 0", () => {
		expect(resolveInnerRadius("abc%" as unknown as InnerRadius, 100)).toBe(0);
		expect(resolveInnerRadius(Number.NaN, 100)).toBe(0);
	});

	test("undefined is 0, which is a pie rather than a donut", () => {
		expect(resolveInnerRadius(undefined, 100)).toBe(0);
	});

	test("a zero outer radius gives a zero inner one", () => {
		expect(resolveInnerRadius("50%", 0)).toBe(0);
	});
});
