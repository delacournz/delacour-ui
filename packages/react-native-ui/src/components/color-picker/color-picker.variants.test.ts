import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import { INPUT_SIZES, INPUT_VARIANTS } from "../input/input.variants";
import {
	COLOR_PICKER_AREA_HEIGHT_PT,
	COLOR_PICKER_CHECKERBOARD_TOKENS,
	COLOR_PICKER_DEFAULT_SIZE,
	COLOR_PICKER_DEFAULT_VALUE,
	COLOR_PICKER_DEFAULT_VARIANT,
	COLOR_PICKER_HUE_STEP,
	COLOR_PICKER_SIZES,
	COLOR_PICKER_STEP,
	COLOR_PICKER_SWATCH_EDGE_PT,
	COLOR_PICKER_THUMB_ANIMATION,
	COLOR_PICKER_VARIANTS,
	colorPickerVariants,
	describeAlphaValue,
	describeAreaValue,
	describeHueValue,
	resolveColorPickerAxes,
	resolveColorPickerLabel,
	resolveTrackInset,
	resolveTriggerAccessibilityLabel,
} from "./color-picker.variants";

/** Tailwind's spacing scale is quarter-rem steps, so a step is four points. */
const POINTS_PER_STEP = 4;

/** The tap target every control in this library has to clear. */
const MINIMUM_TARGET_PT = 44;

function cls(value: string | undefined): string {
	return value ?? "";
}

function step(value: string, utility: "h" | "size" | "py"): number {
	return Number(value.match(new RegExp(`\\b${utility}-(\\d+(?:\\.\\d+)?)\\b`))?.[1]);
}

/** Every colour token a class string names — `bg-x`, `border-x`, `text-x`. */
function colourTokens(value: string): string[] {
	return [...value.matchAll(/\b(?:bg|border|text)-([a-z][\w-]*?)(?:\/\d+)?(?=\s|$)/g)]
		.map((match) => match[1] ?? "")
		.filter((token) => !/^(\d|input-|transparent$|[xytblr]$|[xytblr]-\d)/.test(token) && !/^\d/.test(token));
}

function everyCell(): {
	size: (typeof COLOR_PICKER_SIZES)[number];
	variant: (typeof COLOR_PICKER_VARIANTS)[number];
	isDisabled: boolean;
	isInvalid: boolean;
}[] {
	const cells = [];
	for (const size of COLOR_PICKER_SIZES)
		for (const variant of COLOR_PICKER_VARIANTS)
			for (const isDisabled of [true, false])
				for (const isInvalid of [true, false]) cells.push({ size, variant, isDisabled, isInvalid });
	return cells;
}

describe("axes", () => {
	test("sizes and variants are Input's", () => {
		expect([...COLOR_PICKER_SIZES]).toEqual([...INPUT_SIZES]);
		expect([...COLOR_PICKER_VARIANTS]).toEqual([...INPUT_VARIANTS]);
		expect(COLOR_PICKER_DEFAULT_SIZE).toBe("md");
		expect(COLOR_PICKER_DEFAULT_VARIANT).toBe("primary");
		expect(COLOR_PICKER_DEFAULT_VALUE).toBe("#000000");
	});
});

describe("size tables", () => {
	test("the area is 160, 200 and 240 points tall, and its class says so", () => {
		expect(COLOR_PICKER_AREA_HEIGHT_PT).toEqual({ sm: 160, md: 200, lg: 240 });
		for (const size of COLOR_PICKER_SIZES) {
			const area = cls(colorPickerVariants({ size }).area());
			expect(step(area, "h") * POINTS_PER_STEP).toBe(COLOR_PICKER_AREA_HEIGHT_PT[size]);
		}
	});

	test("the swatch is 24, 32 and 40 points, and its class says so", () => {
		expect(COLOR_PICKER_SWATCH_EDGE_PT).toEqual({ sm: 24, md: 32, lg: 40 });
		for (const size of COLOR_PICKER_SIZES) {
			const swatch = cls(colorPickerVariants({ size }).swatch());
			expect(step(swatch, "size") * POINTS_PER_STEP).toBe(COLOR_PICKER_SWATCH_EDGE_PT[size]);
		}
	});

	test("track thickness and thumb diameter ascend", () => {
		const tracks = COLOR_PICKER_SIZES.map((size) => step(cls(colorPickerVariants({ size }).track()), "h"));
		const thumbs = COLOR_PICKER_SIZES.map((size) => step(cls(colorPickerVariants({ size }).thumb()), "size"));
		expect(tracks).toEqual([...tracks].sort((a, b) => a - b));
		expect(new Set(tracks).size).toBe(3);
		expect(thumbs).toEqual([...thumbs].sort((a, b) => a - b));
		expect(new Set(thumbs).size).toBe(3);
	});

	test("the thumb overhangs its track at every size", () => {
		for (const size of COLOR_PICKER_SIZES) {
			const slots = colorPickerVariants({ size });
			expect(step(cls(slots.thumb()), "size")).toBeGreaterThan(step(cls(slots.track()), "h"));
		}
	});

	test("a track and its touch padding sum to a full target", () => {
		for (const size of COLOR_PICKER_SIZES) {
			const slots = colorPickerVariants({ size });
			const total = (step(cls(slots.track()), "h") + 2 * step(cls(slots.touchArea()), "py")) * POINTS_PER_STEP;
			expect(total).toBe(MINIMUM_TARGET_PT);
		}
	});
});

describe("tokens", () => {
	test("every colour token a slot names exists in both themes", () => {
		const seen = new Set<string>();
		for (const cell of everyCell()) {
			const slots = colorPickerVariants(cell);
			for (const slot of Object.values(slots)) {
				for (const token of colourTokens(cls(slot()))) seen.add(token);
			}
		}
		for (const token of COLOR_PICKER_CHECKERBOARD_TOKENS) seen.add(token);
		expect(seen.size).toBeGreaterThan(0);
		for (const token of seen) {
			expect({ token, count: declarationCount(token) }).toEqual({ token, count: 2 });
		}
	});

	test("the thumb ring names no raw palette colour and no dark: prefix", () => {
		for (const size of COLOR_PICKER_SIZES) {
			const slots = colorPickerVariants({ size });
			for (const ring of [cls(slots.thumb()), cls(slots.thumbInner())]) {
				expect(ring).not.toMatch(/dark:/);
				expect(ring).not.toMatch(/\b(?:white|black|(?:gray|zinc|neutral|slate|stone)-\d+)\b/);
			}
			expect(cls(slots.thumb())).toMatch(/\bborder-background\b/);
			expect(cls(slots.thumbInner())).toMatch(/\bborder-foreground\b/);
		}
	});

	test("the selection ring is a separate layer over a same-width transparent border", () => {
		// The ring is its own layer so its opacity can fade; the swatch keeps a
		// transparent border of the same width so nothing shifts as it appears.
		const slots = colorPickerVariants();
		expect(cls(slots.swatchRing())).toMatch(/\bborder-foreground\b/);
		expect(cls(slots.swatchRing())).toMatch(/\bborder-2\b/);
		expect(cls(slots.swatch())).toMatch(/\bborder-transparent\b/);
		expect(cls(slots.swatch())).toMatch(/\bborder-2\b/);
	});

	test("disabled fades each drawn part once, never the root", () => {
		const disabled = colorPickerVariants({ isDisabled: true });
		for (const slot of [disabled.area, disabled.touchArea, disabled.preview, disabled.swatches]) {
			expect(cls(slot())).toMatch(/\bopacity-50\b/);
		}
		// The trigger row and the hex field are Input boxes, which fade themselves;
		// a faded root would compound them to a quarter.
		expect(cls(disabled.root())).not.toMatch(/opacity/);
		const enabled = colorPickerVariants({ isDisabled: false });
		expect(cls(enabled.area())).not.toMatch(/opacity/);
	});

	test("the grab scales the thumb up", () => {
		expect(COLOR_PICKER_THUMB_ANIMATION.grabbedScale).toBe(1.15);
		expect(COLOR_PICKER_THUMB_ANIMATION.restScale).toBe(1);
	});
});

describe("resolveColorPickerAxes", () => {
	test("defaults", () => {
		expect(resolveColorPickerAxes({})).toEqual({
			size: "md",
			variant: "primary",
			isDisabled: false,
			isInvalid: false,
			isReadOnly: false,
		});
	});

	test("a Field supplies the state axes, and its own prop wins in either direction", () => {
		const field = { isDisabled: true, isInvalid: true };
		expect(resolveColorPickerAxes({ field })).toMatchObject({ isDisabled: true, isInvalid: true });
		expect(resolveColorPickerAxes({ field, own: { isDisabled: false, isInvalid: false } })).toMatchObject({
			isDisabled: false,
			isInvalid: false,
		});
		expect(resolveColorPickerAxes({ own: { isInvalid: true } })).toMatchObject({ isInvalid: true });
	});

	test("a Field cannot reach size, variant or read-only", () => {
		const field = { isDisabled: false, isInvalid: false, size: "lg", variant: "secondary", isReadOnly: true };
		expect(resolveColorPickerAxes({ field })).toMatchObject({ size: "md", variant: "primary", isReadOnly: false });
	});
});

describe("accessibility text", () => {
	test("area, hue and alpha values", () => {
		expect(describeAreaValue({ h: 0, s: 0.6, v: 0.8, a: 1 })).toBe("Saturation 60 percent, brightness 80 percent");
		expect(describeHueValue(210)).toBe("Hue 210 degrees, blue");
		expect(describeHueValue(359.6)).toBe("Hue 0 degrees, red");
		expect(describeAlphaValue(0.5)).toBe("Opacity 50 percent");
	});

	test("a part's name is prefixed by the Field's label, and an override wins", () => {
		expect(resolveColorPickerLabel({ part: "Saturation and brightness" })).toBe("Saturation and brightness");
		expect(resolveColorPickerLabel({ part: "Hue", label: "Accent" })).toBe("Accent, hue");
		expect(resolveColorPickerLabel({ part: "Hue", label: "Accent", override: "Tint" })).toBe("Tint");
	});

	test("the trigger says what it opens", () => {
		expect(resolveTriggerAccessibilityLabel({ hex: "#f59e0b" })).toBe("Colour, #f59e0b, opens picker");
		expect(resolveTriggerAccessibilityLabel({ hex: "#f59e0b", label: "Accent" })).toBe("Accent, #f59e0b, opens picker");
	});

	test("assistive steps are five percent and ten degrees", () => {
		expect(COLOR_PICKER_STEP).toBe(0.05);
		expect(COLOR_PICKER_HUE_STEP).toBe(10);
	});
});

describe("resolveTrackInset", () => {
	test("insets the gradient to the thumb's travel", () => {
		expect(resolveTrackInset(200, 20)).toEqual({ start: 0.05, end: 0.95 });
	});

	test("an unmeasured track spans the whole width, never NaN", () => {
		expect(resolveTrackInset(0, 20)).toEqual({ start: 0, end: 1 });
		expect(resolveTrackInset(200, 0)).toEqual({ start: 0, end: 1 });
	});

	test("a thumb wider than the track collapses to the middle", () => {
		expect(resolveTrackInset(10, 40)).toEqual({ start: 0.5, end: 0.5 });
	});
});
