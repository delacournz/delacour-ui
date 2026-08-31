import { describe, expect, test } from "bun:test";
import { isLiteralColor, themeVariableName, transparentOf } from "./color";

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
		expect(isLiteralColor("destructive-soft-foreground")).toBe(false);
		expect(isLiteralColor("emerald-500")).toBe(false);
	});

	test("treats a raw CSS variable name as a token", () => {
		expect(isLiteralColor("--color-foreground")).toBe(false);
	});

	test("does not mistake an empty string for a literal", () => {
		expect(isLiteralColor("")).toBe(false);
	});
});

describe("themeVariableName", () => {
	test("prefixes a bare token name", () => {
		expect(themeVariableName("foreground")).toBe("--foreground");
		expect(themeVariableName("destructive-soft-foreground")).toBe("--destructive-soft-foreground");
		expect(themeVariableName("chart-1")).toBe("--chart-1");
	});

	test("passes a raw variable name through", () => {
		expect(themeVariableName("--foreground")).toBe("--foreground");
	});

	// `theme.css` maps the raw names onto `--color-*` through `@theme inline`,
	// and `inline` emits no `--color-*` variable at all — so the prefixed form
	// a caller may have written before would miss on every render.
	test("rewrites the pre-shadcn --color- form onto the raw name", () => {
		expect(themeVariableName("--color-foreground")).toBe("--foreground");
		expect(themeVariableName("--color-destructive-soft")).toBe("--destructive-soft");
	});
});

describe("transparentOf", () => {
	test("keeps the hue and drops the alpha, so a fade never runs through black", () => {
		expect(transparentOf("#0a0a0a")).toBe("#0a0a0a00");
		expect(transparentOf("#FFFFFF")).toBe("#FFFFFF00");
	});

	test("expands a short hex, which cannot simply take a suffix", () => {
		expect(transparentOf("#abc")).toBe("#aabbcc00");
	});

	test("replaces an alpha the colour already carries rather than appending a second", () => {
		expect(transparentOf("#0a0a0aff")).toBe("#0a0a0a00");
		expect(transparentOf("#abcd")).toBe("#aabbcc00");
	});

	test("rewrites functional notation in place", () => {
		expect(transparentOf("rgb(10, 20, 30)")).toBe("rgba(10, 20, 30, 0)");
		expect(transparentOf("rgba(10, 20, 30, 0.5)")).toBe("rgba(10, 20, 30, 0)");
	});

	test("gives up rather than guessing, so a caller can decline to draw", () => {
		expect(transparentOf(undefined)).toBeUndefined();
		expect(transparentOf("rebeccapurple")).toBeUndefined();
		expect(transparentOf("oklch(0.5 0.1 200)")).toBeUndefined();
	});
});
