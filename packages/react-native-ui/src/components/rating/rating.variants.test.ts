import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import { TEXT_SIZES } from "../text/text.variants";
import {
	clampRating,
	describeRating,
	formatRatingValue,
	normalizeRatingCount,
	normalizeRatingStep,
	RATING_COLORS,
	RATING_COUNT,
	RATING_DEFAULT_COLOR,
	RATING_DEFAULT_SIZE,
	RATING_EMPTY_OPACITY,
	RATING_FILL_TOKEN,
	RATING_OUTPUT_TEXT_SIZE,
	RATING_SIZES,
	RATING_STAR_PATH,
	RATING_STEP,
	RATING_TAP_SLOP,
	ratingFromOffset,
	ratingVariants,
	resolveRatingAxes,
	resolveRatingPaint,
	shouldClearRating,
	starFillOf,
	stepRating,
} from "./rating.variants";

/** Tailwind's spacing scale is quarter-rem steps, so a step is four points. */
const POINTS_PER_STEP = 4;

/** The tap target every control in this library has to clear. */
const MINIMUM_TARGET_PT = 44;

/** The `--spacing-icon-*` scale in points, as `tokens.css` declares it. */
const ICON_POINTS: Record<string, number> = { xs: 14, sm: 16, md: 18, lg: 20, xl: 24, "2xl": 32 };

/** The `py-*` step a class string sets — `py-2.5` yields 2.5. */
function paddingYStep(value: string): number {
	return Number(value.match(/\bpy-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/** The icon step a `size-icon-*` class names — `size-icon-xl` yields `xl`. */
function iconStep(value: string): string | undefined {
	return value.match(/\bsize-icon-([\w]+)\b/)?.[1];
}

describe("normalizeRatingCount", () => {
	test("a positive whole number passes through", () => {
		expect(normalizeRatingCount(5)).toBe(5);
		expect(normalizeRatingCount(10)).toBe(10);
	});

	test("a fraction rounds down, never up", () => {
		expect(normalizeRatingCount(4.9)).toBe(4);
	});

	test("anything that cannot be a star count falls back to the default", () => {
		for (const bad of [0, -3, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(normalizeRatingCount(bad)).toBe(RATING_COUNT);
		}
		expect(normalizeRatingCount(undefined)).toBe(RATING_COUNT);
	});
});

describe("normalizeRatingStep", () => {
	test("whole and half stars pass through", () => {
		expect(normalizeRatingStep(1)).toBe(1);
		expect(normalizeRatingStep(0.5)).toBe(0.5);
		expect(normalizeRatingStep(0.25)).toBe(0.25);
	});

	test("a step that does not divide one star falls back to whole stars", () => {
		expect(normalizeRatingStep(0.3)).toBe(RATING_STEP);
		expect(normalizeRatingStep(0.4)).toBe(RATING_STEP);
	});

	test("a step past one star, zero, negative or non-finite falls back to whole stars", () => {
		for (const bad of [0, -0.5, 2, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(normalizeRatingStep(bad)).toBe(RATING_STEP);
		}
		expect(normalizeRatingStep(undefined)).toBe(RATING_STEP);
	});
});

describe("clampRating", () => {
	test("holds a value inside zero and the count", () => {
		expect(clampRating(3.5, 5)).toBe(3.5);
		expect(clampRating(-1, 5)).toBe(0);
		expect(clampRating(9, 5)).toBe(5);
	});

	test("a non-finite rating renders as zero rather than as a NaN width", () => {
		expect(clampRating(Number.NaN, 5)).toBe(0);
		expect(clampRating(Number.POSITIVE_INFINITY, 5)).toBe(0);
	});

	test("does not snap — a read-only display may show any value", () => {
		expect(clampRating(3.7, 5)).toBe(3.7);
	});
});

describe("starFillOf", () => {
	test("every star before the value is full, every star after it is empty", () => {
		expect([0, 1, 2, 3, 4].map((index) => starFillOf(index, 3))).toEqual([1, 1, 1, 0, 0]);
	});

	test("the star the value lands inside is partly filled", () => {
		expect(starFillOf(3, 3.5)).toBe(0.5);
		expect(starFillOf(2, 2.25)).toBeCloseTo(0.25);
	});

	test("zero fills nothing", () => {
		expect([0, 1, 2, 3, 4].map((index) => starFillOf(index, 0))).toEqual([0, 0, 0, 0, 0]);
	});

	test("the fills sum back to the value", () => {
		for (const value of [0, 0.5, 1, 2.5, 3.7, 5]) {
			const sum = [0, 1, 2, 3, 4].reduce((total, index) => total + starFillOf(index, value), 0);
			expect(sum).toBeCloseTo(value);
		}
	});
});

describe("ratingFromOffset", () => {
	const width = 200;
	const count = 5;

	test("a touch inside a star's cell takes that star, whole stars", () => {
		expect(ratingFromOffset({ count, position: 10, step: 1, width })).toBe(1);
		expect(ratingFromOffset({ count, position: 39, step: 1, width })).toBe(1);
		expect(ratingFromOffset({ count, position: 41, step: 1, width })).toBe(2);
		expect(ratingFromOffset({ count, position: 199, step: 1, width })).toBe(5);
	});

	test("half stars split each cell at its centre", () => {
		expect(ratingFromOffset({ count, position: 10, step: 0.5, width })).toBe(0.5);
		expect(ratingFromOffset({ count, position: 30, step: 0.5, width })).toBe(1);
		expect(ratingFromOffset({ count, position: 130, step: 0.5, width })).toBe(3.5);
	});

	test("a cell edge belongs to the star before it, not a sliver of the next", () => {
		expect(ratingFromOffset({ count, position: 80, step: 1, width })).toBe(2);
	});

	test("a drag past the start holds the lowest stop rather than clearing", () => {
		expect(ratingFromOffset({ count, position: -50, step: 1, width })).toBe(1);
		expect(ratingFromOffset({ count, position: 0, step: 0.5, width })).toBe(0.5);
	});

	test("a drag past the end holds the count", () => {
		expect(ratingFromOffset({ count, position: 900, step: 0.5, width })).toBe(5);
	});

	test("an unmeasured row reports zero rather than dividing by it", () => {
		expect(ratingFromOffset({ count, position: 40, step: 1, width: 0 })).toBe(0);
	});

	test("quarter steps do not leak floating-point noise", () => {
		const value = ratingFromOffset({ count, position: 43, step: 0.25, width });
		expect(value).toBe(1.25);
	});
});

describe("stepRating", () => {
	test("an increment moves by one step and stops at the count", () => {
		expect(stepRating(3, 1, 1, 5)).toBe(4);
		expect(stepRating(4.5, 1, 1, 5)).toBe(5);
		expect(stepRating(5, 1, 0.5, 5)).toBe(5);
	});

	test("a decrement moves by one step and stops at zero", () => {
		expect(stepRating(3, -1, 0.5, 5)).toBe(2.5);
		expect(stepRating(0, -1, 1, 5)).toBe(0);
	});

	test("a value between stops lands on the next stop rather than a step past it", () => {
		expect(stepRating(3.7, 1, 1, 5)).toBe(4);
		expect(stepRating(3.7, -1, 1, 5)).toBe(3);
	});
});

describe("shouldClearRating", () => {
	test("a tap on the current value clears it when clearing is allowed", () => {
		expect(shouldClearRating({ allowClear: true, startValue: 3, touchedValue: 3, travel: 0 })).toBe(true);
	});

	test("never clears when clearing is off", () => {
		expect(shouldClearRating({ allowClear: false, startValue: 3, touchedValue: 3, travel: 0 })).toBe(false);
	});

	test("a tap on another star moves the value instead", () => {
		expect(shouldClearRating({ allowClear: true, startValue: 3, touchedValue: 4, travel: 0 })).toBe(false);
	});

	test("a drag that comes back to where it started is a drag, not a tap", () => {
		expect(shouldClearRating({ allowClear: true, startValue: 3, touchedValue: 3, travel: RATING_TAP_SLOP + 1 })).toBe(
			false
		);
	});

	test("an empty rating has nothing to clear", () => {
		expect(shouldClearRating({ allowClear: true, startValue: 0, touchedValue: 0, travel: 0 })).toBe(false);
	});
});

describe("formatRatingValue and describeRating", () => {
	test("whole values read without a decimal", () => {
		expect(formatRatingValue(4)).toBe("4");
	});

	test("fractions keep at most two places", () => {
		expect(formatRatingValue(3.5)).toBe("3.5");
		expect(formatRatingValue(3.666)).toBe("3.67");
	});

	test("the spoken value names the count", () => {
		expect(describeRating(3.5, 5)).toBe("3.5 out of 5");
		expect(describeRating(0, 10)).toBe("0 out of 10");
	});
});

describe("resolveRatingPaint", () => {
	test("every colour names a fill token", () => {
		for (const color of RATING_COLORS) {
			expect(resolveRatingPaint({ color, isInvalid: false }).fill).toBe(RATING_FILL_TOKEN[color]);
		}
	});

	test("invalid outranks the colour, on the filled and the empty stars both", () => {
		for (const color of RATING_COLORS) {
			expect(resolveRatingPaint({ color, isInvalid: true })).toEqual({
				empty: "destructive",
				fill: "destructive",
			});
		}
	});

	test("an empty star is the same chrome at every colour", () => {
		const empties = new Set(RATING_COLORS.map((color) => resolveRatingPaint({ color, isInvalid: false }).empty));
		expect(empties.size).toBe(1);
	});

	test("the empty star is faint but not invisible", () => {
		expect(RATING_EMPTY_OPACITY).toBeGreaterThan(0);
		expect(RATING_EMPTY_OPACITY).toBeLessThan(1);
	});

	test("every token named is declared in both variants of theme.css", () => {
		const tokens = new Set<string>();
		for (const color of RATING_COLORS) {
			for (const isInvalid of [true, false]) {
				const paint = resolveRatingPaint({ color, isInvalid });
				tokens.add(paint.fill);
				tokens.add(paint.empty);
			}
		}
		for (const token of tokens) {
			expect(declarationCount(token)).toBe(2);
		}
	});
});

describe("ratingVariants", () => {
	test("the touch area clears 44pt at every size", () => {
		for (const size of RATING_SIZES) {
			const slots = ratingVariants({ size });
			const glyph = ICON_POINTS[iconStep(slots.glyph()) ?? ""];
			const padding = paddingYStep(slots.stars()) * POINTS_PER_STEP;
			expect(glyph).toBeDefined();
			expect((glyph ?? 0) + padding * 2).toBe(MINIMUM_TARGET_PT);
		}
	});

	test("the glyph grows with the size", () => {
		const points = RATING_SIZES.map((size) => ICON_POINTS[iconStep(ratingVariants({ size }).glyph()) ?? ""] ?? 0);
		expect(points).toEqual([...points].sort((a, b) => a - b));
		expect(new Set(points).size).toBe(RATING_SIZES.length);
	});

	test("disabled fades the root, read-only does not", () => {
		expect(ratingVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(ratingVariants({ isDisabled: false }).root() ?? "").not.toContain("opacity");
	});

	test("the fill clip hides what overhangs its width", () => {
		expect(ratingVariants({}).clip()).toContain("overflow-hidden");
	});

	test("a caller's class merges onto the slot", () => {
		expect(ratingVariants({}).root({ className: "mt-4" })).toContain("mt-4");
	});
});

describe("defaults", () => {
	test("tv's defaults and the resolver's are the same pair", () => {
		const axes = resolveRatingAxes({});
		expect(axes.color).toBe(RATING_DEFAULT_COLOR);
		expect(axes.size).toBe(RATING_DEFAULT_SIZE);
		expect(ratingVariants({}).glyph()).toBe(ratingVariants({ size: RATING_DEFAULT_SIZE }).glyph());
	});

	test("the output names a size Text actually has", () => {
		for (const size of RATING_SIZES) {
			expect(TEXT_SIZES).toContain(RATING_OUTPUT_TEXT_SIZE[size]);
		}
	});

	test("the star path is a closed ten-point outline inside the 24pt box", () => {
		expect(RATING_STAR_PATH.startsWith("M")).toBe(true);
		expect(RATING_STAR_PATH.endsWith("Z")).toBe(true);
		const numbers = RATING_STAR_PATH.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
		expect(numbers.length).toBe(20);
		for (const coordinate of numbers) {
			expect(coordinate).toBeGreaterThanOrEqual(0);
			expect(coordinate).toBeLessThanOrEqual(24);
		}
	});
});

describe("resolveRatingAxes", () => {
	test("a Field's state reaches the rating", () => {
		expect(resolveRatingAxes({ field: { isDisabled: true, isInvalid: true } })).toMatchObject({
			isDisabled: true,
			isInvalid: true,
		});
	});

	test("an explicit false beats the Field", () => {
		expect(
			resolveRatingAxes({ field: { isDisabled: true, isInvalid: true }, own: { isDisabled: false, isInvalid: false } })
		).toMatchObject({ isDisabled: false, isInvalid: false });
	});

	test("read-only is the rating's own, never the Field's", () => {
		expect(resolveRatingAxes({ field: { isDisabled: false, isInvalid: false } }).isReadOnly).toBe(false);
		expect(resolveRatingAxes({ own: { isReadOnly: true } }).isReadOnly).toBe(true);
	});

	test("a Field carries no paint axis", () => {
		const field = { color: "info", isDisabled: false, isInvalid: false, size: "lg" } as const;
		const axes = resolveRatingAxes({ field });
		expect(axes.color).toBe(RATING_DEFAULT_COLOR);
		expect(axes.size).toBe(RATING_DEFAULT_SIZE);
	});
});
