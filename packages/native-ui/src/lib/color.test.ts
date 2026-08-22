import { describe, expect, test } from "bun:test";
import { isLiteralColor } from "./color";

describe("isLiteralColor", () => {
	test("treats hex as a literal", () => {
		expect(isLiteralColor("#EC4899")).toBe(true);
		expect(isLiteralColor("#fff")).toBe(true);
		expect(isLiteralColor("#00000080")).toBe(true);
	});

	test("treats functional notation as a literal", () => {
		expect(isLiteralColor("rgb(236, 72, 153)")).toBe(true);
		expect(isLiteralColor("rgba(0, 0, 0, 0.5)")).toBe(true);
		expect(isLiteralColor("hsl(330 81% 60%)")).toBe(true);
		expect(isLiteralColor("oklch(0.7 0.2 20)")).toBe(true);
		expect(isLiteralColor("color-mix(in oklch, red, blue)")).toBe(true);
	});

	test("treats a theme token name as a token", () => {
		expect(isLiteralColor("foreground")).toBe(false);
		expect(isLiteralColor("primary-foreground")).toBe(false);
		expect(isLiteralColor("danger-soft-foreground")).toBe(false);
		expect(isLiteralColor("emerald-500")).toBe(false);
	});

	test("treats a raw CSS variable name as a token", () => {
		expect(isLiteralColor("--color-foreground")).toBe(false);
	});

	test("does not mistake an empty string for a literal", () => {
		expect(isLiteralColor("")).toBe(false);
	});
});
