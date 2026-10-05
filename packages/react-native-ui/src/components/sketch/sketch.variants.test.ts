import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import { SKETCH_SHAPES, SKETCH_TOOLS } from "./sketch.paths";
import {
	clampSketchSize,
	resolveSketchAccessibilityLabel,
	resolveSketchColor,
	resolveSwatchLabel,
	SKETCH_DEFAULT_COLORS,
	SKETCH_DEFAULT_SIZE,
	SKETCH_LABELS,
	SKETCH_MAX_SIZE,
	SKETCH_MIN_SIZE,
	SKETCH_SLOTS,
	sketchVariants,
} from "./sketch.variants";

/** Classes that name a colour, by prefix — `border-continuous` and `border-t` are geometry, not paint. */
const NON_COLOR = new Set(["continuous", "t", "b", "l", "r", "0", "2", "transparent"]);

function colorTokensOf(classes: string): string[] {
	return [...classes.matchAll(/(?:^|\s)(?:bg|border|text)-([a-z][a-z-]*)(?=\s|$)/g)]
		.map((match) => match[1] ?? "")
		.filter((token) => !NON_COLOR.has(token));
}

function everySlot(): string[] {
	const out: string[] = [];
	for (const isSelected of [true, false]) {
		for (const isDisabled of [true, false]) {
			const slots = sketchVariants({ isDisabled, isSelected });
			for (const slot of SKETCH_SLOTS) out.push(slots[slot]());
		}
	}
	return out;
}

describe("sketchVariants", () => {
	test("the canvas is a clipped card", () => {
		const canvas = sketchVariants().canvas();
		for (const cls of ["overflow-hidden", "rounded-lg", "border-continuous", "bg-card", "border-border"]) {
			expect(canvas).toContain(cls);
		}
	});

	test("no slot casts a shadow, names a dark variant or aligns itself", () => {
		for (const classes of everySlot()) {
			expect(classes).not.toMatch(/(?:^|\s)shadow/);
			expect(classes).not.toContain("dark:");
			expect(classes).not.toMatch(/(?:^|\s)self-/);
		}
	});

	test("the selected swatch rings, and the unselected one reserves the same border", () => {
		const on = sketchVariants({ isSelected: true }).swatchRing();
		const off = sketchVariants({ isSelected: false }).swatchRing();
		expect(on).toContain("border-ring");
		expect(off).toContain("border-transparent");
		const width = (classes: string) => classes.match(/(?:^|\s)(border(?:-\d)?)(?=\s|$)/)?.[1];
		expect(width(on)).toBeDefined();
		expect(width(on)).toBe(width(off));
	});

	test("the swatch target is a button step and the dot a glyph step", () => {
		expect(sketchVariants().swatch()).toContain("size-button-sm");
		expect(sketchVariants().swatchDot()).toMatch(/size-icon-/);
	});

	test("disabled fades the toolbar, never the canvas", () => {
		expect(sketchVariants({ isDisabled: true }).toolbar()).toContain("opacity-50");
		expect(sketchVariants({ isDisabled: false }).toolbar()).not.toContain("opacity");
		expect(sketchVariants({ isDisabled: true }).canvas()).not.toContain("opacity");
	});

	test("the toolbar sits on the card, ruled above, in the screen gutter", () => {
		const toolbar = sketchVariants().toolbar();
		for (const cls of ["bg-card", "border-t", "border-border", "px-screen-gutter"]) expect(toolbar).toContain(cls);
	});

	test("no raw palette colour, and every token is declared in both themes", () => {
		for (const classes of everySlot()) {
			for (const token of colorTokensOf(classes)) {
				expect(token).not.toMatch(/-\d{2,3}$/);
				expect({ token, count: declarationCount(token) }).toEqual({ count: 2, token });
			}
		}
	});
});

describe("defaults", () => {
	test("the swatches are theme tokens, each declared in both themes", () => {
		expect(SKETCH_DEFAULT_COLORS).toEqual(["foreground", "destructive", "warning", "success", "info", "primary"]);
		for (const token of SKETCH_DEFAULT_COLORS) expect(declarationCount(token)).toBe(2);
	});

	test("stroke width", () => {
		expect([SKETCH_MIN_SIZE, SKETCH_DEFAULT_SIZE, SKETCH_MAX_SIZE]).toEqual([1, 4, 24]);
	});

	test("every tool and shape has a label", () => {
		for (const key of [...SKETCH_TOOLS, ...SKETCH_SHAPES]) expect(SKETCH_LABELS[key].length).toBeGreaterThan(0);
		expect(SKETCH_LABELS.pen).toBe("Pen");
		expect(SKETCH_LABELS.eraser).toBe("Eraser");
		expect(SKETCH_LABELS.rectangle).toBe("Rectangle");
	});
});

describe("resolveSketchColor", () => {
	const tokens = { primary: "oklch(0.205 0 0)" };

	test("a literal passes through", () => {
		expect(resolveSketchColor("#ec4899", tokens)).toBe("#ec4899");
	});

	test("a token resolves to its literal", () => {
		expect(resolveSketchColor("primary", tokens)).toBe("oklch(0.205 0 0)");
	});

	test("an unknown token, or an unsafe value, is undefined", () => {
		expect(resolveSketchColor("nope", tokens)).toBeUndefined();
		expect(resolveSketchColor("url(#x)", tokens)).toBeUndefined();
		expect(resolveSketchColor("evil", { evil: '"><script>' })).toBeUndefined();
	});
});

describe("clampSketchSize", () => {
	test("clamps into range", () => {
		expect(clampSketchSize(0, 1, 24)).toBe(1);
		expect(clampSketchSize(99, 1, 24)).toBe(24);
		expect(clampSketchSize(8, 1, 24)).toBe(8);
	});

	test("NaN falls back to the default width", () => {
		expect(clampSketchSize(Number.NaN, 1, 24)).toBe(4);
	});

	test("a reversed range is swapped", () => {
		expect(clampSketchSize(99, 24, 1)).toBe(24);
		expect(clampSketchSize(0, 24, 1)).toBe(1);
	});
});

describe("accessibility labels", () => {
	test("the canvas counts marks, erasers included", () => {
		expect(resolveSketchAccessibilityLabel([])).toBe("Drawing, empty");
		expect(resolveSketchAccessibilityLabel([{ d: "M0 0", id: "a", kind: "erase", width: 4 }])).toBe(
			"Drawing, 1 mark"
		);
		const three = ["a", "b", "c"].map((id) => ({ d: "M0 0", id, kind: "erase" as const, width: 4 }));
		expect(resolveSketchAccessibilityLabel(three)).toBe("Drawing, 3 marks");
	});

	test("a token swatch is named for its token, a literal by position", () => {
		expect(resolveSwatchLabel("primary", 0, 6)).toBe("Primary");
		expect(resolveSwatchLabel("muted-foreground", 0, 6)).toBe("Muted foreground");
		expect(resolveSwatchLabel("#ec4899", 2, 6)).toBe("Colour 3 of 6");
	});
});
