import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TEXT_SIZES } from "../text/text.variants";
import {
	clampThumb,
	fillBounds,
	fillExtent,
	formatSliderValue,
	fromValueArray,
	nearestThumbIndex,
	progressOf,
	resolveSliderAxes,
	SLIDER_COLORS,
	SLIDER_DEFAULT_COLOR,
	SLIDER_DEFAULT_ORIENTATION,
	SLIDER_DEFAULT_SIZE,
	SLIDER_HAPTIC_MIN_TRAVEL,
	SLIDER_MAX_VALUE,
	SLIDER_MIN_VALUE,
	SLIDER_ORIENTATIONS,
	SLIDER_OUTPUT_TEXT_SIZE,
	SLIDER_RANGE_SEPARATOR,
	SLIDER_SIZES,
	SLIDER_STEP,
	SLIDER_THUMB_ANIMATION,
	SLIDER_THUMB_SPRING,
	shouldTickHaptic,
	sliderVariants,
	snapToStep,
	toValueArray,
	valueFromOffset,
} from "./slider.variants";

const THEME_CSS = readFileSync(join(import.meta.dirname, "../../styles/theme.css"), "utf-8");

/** How many times theme.css declares a `--color-*` token — once per variant, so two. */
function themeDeclarations(token: string): number {
	return THEME_CSS.match(new RegExp(`--color-${token}:`, "g"))?.length ?? 0;
}

/** The bare colour a `bg-*` class names — `bg-success` yields `success`. */
function backgroundToken(value: string): string | undefined {
	return value.match(/\bbg-([\w-]+)\b/)?.[1];
}

/**
 * A slot's class string, with `tv`'s empty-slot `undefined` flattened.
 *
 * A slot that emits nothing returns `undefined` rather than `""` — correct, but
 * it makes a bare `not.toMatch()` throw rather than pass.
 */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The `h-*` step a class string sets — `h-1.5` yields 1.5. */
function heightStep(value: string): number {
	return Number(value.match(/\bh-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/** The `w-*` step a class string sets — `w-1.5` yields 1.5. */
function widthStep(value: string): number {
	return Number(value.match(/\bw-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/** The `size-*` step a class string sets — `size-5` yields 5. */
function sizeStep(value: string): number {
	return Number(value.match(/\bsize-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/** The `py-*` / `px-*` step a class string sets — `py-3.5` yields 3.5. */
function paddingStep(value: string): number {
	return Number(value.match(/\bp[xy]-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/** Tailwind's spacing scale is quarter-rem steps, so a step is four points. */
const POINTS_PER_STEP = 4;

/** The tap target every control in this library has to clear. */
const MINIMUM_TARGET_PT = 44;

/** Every combination of the axes that paint a slider, as `tv` props. */
function everyCell(): {
	color: (typeof SLIDER_COLORS)[number];
	size: (typeof SLIDER_SIZES)[number];
	orientation: (typeof SLIDER_ORIENTATIONS)[number];
	isDisabled: boolean;
	isInvalid: boolean;
}[] {
	const cells = [];
	for (const color of SLIDER_COLORS) {
		for (const size of SLIDER_SIZES) {
			for (const orientation of SLIDER_ORIENTATIONS) {
				for (const isDisabled of [false, true]) {
					for (const isInvalid of [false, true]) {
						cells.push({ color, size, orientation, isDisabled, isInvalid });
					}
				}
			}
		}
	}
	return cells;
}

describe("the theme reader", () => {
	// Guard: every assertion below that reads tokens.css is worthless if the
	// parse silently found nothing. The suite must not be able to go green empty.
	test("finds both variants of the theme", () => {
		expect(themeDeclarations("primary")).toBe(2);
	});
});

describe("the axes", () => {
	test("name the six semantic colours Badge and Checkbox share", () => {
		expect([...SLIDER_COLORS]).toEqual(["default", "primary", "success", "warning", "danger", "info"]);
	});

	test("name three sizes and two orientations", () => {
		expect([...SLIDER_SIZES]).toEqual(["sm", "md", "lg"]);
		expect([...SLIDER_ORIENTATIONS]).toEqual(["horizontal", "vertical"]);
	});

	// The defaults are read twice — by `defaultVariants` and by
	// `resolveSliderAxes`, which runs before `tv` is ever called. A drift between
	// them is a slider that renders at one size and reports another.
	test("default to values the axes actually hold", () => {
		expect(SLIDER_COLORS).toContain(SLIDER_DEFAULT_COLOR);
		expect(SLIDER_SIZES).toContain(SLIDER_DEFAULT_SIZE);
		expect(SLIDER_ORIENTATIONS).toContain(SLIDER_DEFAULT_ORIENTATION);
	});

	test("default the range to 0–100 in whole steps", () => {
		expect(SLIDER_MIN_VALUE).toBe(0);
		expect(SLIDER_MAX_VALUE).toBe(100);
		expect(SLIDER_STEP).toBe(1);
		expect(SLIDER_MAX_VALUE).toBeGreaterThan(SLIDER_MIN_VALUE);
	});
});

describe("sliderVariants", () => {
	test("paints the fill differently for every colour", () => {
		const painted = new Set(SLIDER_COLORS.map((color) => cls(sliderVariants({ color }).fill())));
		expect(painted.size).toBe(SLIDER_COLORS.length);
	});

	// The empty track is chrome at every colour, the way an unticked checkbox is
	// `border-input bg-card` however it is coloured — so the colour axis has one
	// slot to paint rather than a matrix.
	test("leaves the track and the thumb the same at every colour", () => {
		const tracks = new Set(SLIDER_COLORS.map((color) => cls(sliderVariants({ color }).track())));
		const thumbs = new Set(SLIDER_COLORS.map((color) => cls(sliderVariants({ color }).thumb())));
		expect(tracks.size).toBe(1);
		expect(thumbs.size).toBe(1);
	});

	test("reddens the fill when invalid, whatever the colour", () => {
		for (const color of SLIDER_COLORS) {
			expect(cls(sliderVariants({ color, isInvalid: true }).fill())).toMatch(/\bbg-danger\b/);
		}
	});

	// Nothing in this package draws a shadow, and RN's shadow props diverge
	// between platforms in a way a one-pixel border does not.
	test("gives the thumb a border and never a shadow", () => {
		for (const cell of everyCell()) {
			const slots = sliderVariants(cell);
			// A width *and* a colour: `border` alone leaves the ring at React Native's
			// default black, which is invisible in dark mode and wrong in light.
			expect(cls(slots.thumb())).toMatch(/(^|\s)border(\s|$)/);
			expect(cls(slots.thumb())).toMatch(/\bborder-(?!\d)[\w-]+/);
			for (const slot of [
				slots.root(),
				slots.touchArea(),
				slots.track(),
				slots.fill(),
				slots.thumb(),
				slots.output(),
			]) {
				expect(cls(slot)).not.toMatch(/shadow/);
			}
		}
	});

	// Rule 1: a View cannot cascade colour to a Text descendant, and the output
	// renders a `Text` preset that owns its own scale, weight and colour.
	test("puts no type treatment on any slot", () => {
		for (const cell of everyCell()) {
			const slots = sliderVariants(cell);
			for (const slot of [
				slots.root(),
				slots.touchArea(),
				slots.track(),
				slots.fill(),
				slots.thumb(),
				slots.output(),
			]) {
				expect(cls(slot)).not.toMatch(/\btext-(?!ellipsis|clip)/);
				expect(cls(slot)).not.toMatch(/\bfont-/);
			}
		}
	});

	test("swaps the track's axis with the orientation rather than restating it", () => {
		for (const size of SLIDER_SIZES) {
			const horizontal = cls(sliderVariants({ orientation: "horizontal", size }).track());
			const vertical = cls(sliderVariants({ orientation: "vertical", size }).track());
			// Both extractors yield NaN for anything that is not a numeric step, and
			// `expect(NaN).toBe(NaN)` *passes* — so without this the test would go
			// falsely green the moment the thickness stopped being a plain class.
			expect(Number.isFinite(heightStep(horizontal))).toBe(true);
			expect(Number.isFinite(widthStep(vertical))).toBe(true);
			expect(heightStep(horizontal)).toBe(widthStep(vertical));
			expect(horizontal).toMatch(/\bw-full\b/);
			expect(vertical).toMatch(/\bh-full\b/);
		}
	});

	// Padding the main axis would offset every value by the gutter — silently, and
	// visibly only at the two ends. A test is the cheapest place to catch it.
	test("pads the touch area on the cross axis only", () => {
		const horizontal = cls(sliderVariants({ orientation: "horizontal" }).touchArea());
		const vertical = cls(sliderVariants({ orientation: "vertical" }).touchArea());
		expect(horizontal).toMatch(/\bpy-\d/);
		expect(horizontal).not.toMatch(/\b(px|pl|pr|p)-\d/);
		expect(vertical).toMatch(/\bpx-\d/);
		expect(vertical).not.toMatch(/\b(py|pt|pb|p)-\d/);
	});

	// The thickness and its padding live in one compound cell because they are one
	// number. Asserting the sum rather than the parts is what lets the ladder be
	// retuned without the test becoming a transcript of it.
	test("brings every size up to a 44pt target, track plus padding", () => {
		for (const size of SLIDER_SIZES) {
			for (const orientation of SLIDER_ORIENTATIONS) {
				const slots = sliderVariants({ orientation, size });
				const track = cls(slots.track());
				const thickness = orientation === "horizontal" ? heightStep(track) : widthStep(track);
				const padding = paddingStep(cls(slots.touchArea()));
				expect(Number.isFinite(thickness)).toBe(true);
				expect(Number.isFinite(padding)).toBe(true);
				expect((thickness + padding * 2) * POINTS_PER_STEP).toBe(MINIMUM_TARGET_PT);
			}
		}
	});

	test("thickens the track as the size steps up", () => {
		const steps = SLIDER_SIZES.map((size) =>
			heightStep(cls(sliderVariants({ orientation: "horizontal", size }).track()))
		);
		expect(steps).toEqual([...steps].sort((a, b) => a - b));
		expect(new Set(steps).size).toBe(SLIDER_SIZES.length);
	});

	// The invariant the whole geometry rests on. `fillExtent` lands exactly on both
	// extremes only while these two are the same number: inset the thumb inside the
	// track and there is stray colour at the minimum and empty groove at the
	// maximum, at every size.
	test("draws the thumb at exactly the track's thickness", () => {
		for (const size of SLIDER_SIZES) {
			const thumb = sizeStep(cls(sliderVariants({ size }).thumb()));
			const horizontal = heightStep(cls(sliderVariants({ orientation: "horizontal", size }).track()));
			const vertical = widthStep(cls(sliderVariants({ orientation: "vertical", size }).track()));
			expect(Number.isFinite(thumb)).toBe(true);
			expect(thumb).toBe(horizontal);
			expect(thumb).toBe(vertical);
		}
	});

	test("steps the thumb up with the size, in step with the track", () => {
		const steps = SLIDER_SIZES.map((size) => sizeStep(cls(sliderVariants({ size }).thumb())));
		expect(steps).toEqual([...steps].sort((a, b) => a - b));
		expect(new Set(steps).size).toBe(SLIDER_SIZES.length);
	});

	// The centring is a no-op while the thumb and the track are the same size, and
	// stays because it is load-bearing again the moment they are allowed to differ.
	test("centres the thumb from the track, at every size", () => {
		for (const size of SLIDER_SIZES) {
			for (const orientation of SLIDER_ORIENTATIONS) {
				const track = cls(sliderVariants({ orientation, size }).track());
				expect(track).toMatch(/\bitems-center\b/);
				expect(track).toMatch(/\brelative\b/);
			}
		}
	});

	test("fades the track and the thumb when disabled, and only then", () => {
		expect(cls(sliderVariants({ isDisabled: true }).root())).toMatch(/\bopacity-50\b/);
		expect(cls(sliderVariants({ isDisabled: false }).root())).not.toMatch(/\bopacity-/);
	});

	test("hands a caller's className to the slot it names", () => {
		expect(sliderVariants({}).track({ className: "h-8" })).toMatch(/\bh-8\b/);
		expect(sliderVariants({}).fill({ className: "bg-accent" })).toMatch(/\bbg-accent\b/);
	});
});

describe("SLIDER_OUTPUT_TEXT_SIZE", () => {
	test("names a size Text actually has, for every slider size", () => {
		for (const size of SLIDER_SIZES) {
			expect(TEXT_SIZES).toContain(SLIDER_OUTPUT_TEXT_SIZE[size]);
		}
	});

	test("steps up with the slider's own size", () => {
		const steps = SLIDER_SIZES.map((size) => TEXT_SIZES.indexOf(SLIDER_OUTPUT_TEXT_SIZE[size]));
		expect(steps).toEqual([...steps].sort((a, b) => a - b));
	});
});

describe("the thumb's animation", () => {
	test("springs rather than easing, and settles", () => {
		expect(SLIDER_THUMB_SPRING.damping).toBeGreaterThan(0);
		expect(SLIDER_THUMB_SPRING.mass).toBeGreaterThan(0);
		expect(SLIDER_THUMB_SPRING.stiffness).toBeGreaterThan(0);
	});

	// The grabbed thumb grows rather than shrinking: a slider's thumb travels out
	// from under the finger, so it has to stay findable while it is covered.
	test("grows the grabbed thumb, and rests at its drawn size", () => {
		expect(SLIDER_THUMB_ANIMATION.restScale).toBe(1);
		expect(SLIDER_THUMB_ANIMATION.grabbedScale).toBeGreaterThan(SLIDER_THUMB_ANIMATION.restScale);
		expect(SLIDER_THUMB_ANIMATION.grabbedScale).toBeLessThanOrEqual(1.5);
	});
});

describe("toValueArray / fromValueArray", () => {
	test("normalise both shapes to an array", () => {
		expect(toValueArray(30)).toEqual([30]);
		expect(toValueArray([200, 800])).toEqual([200, 800]);
	});

	test("round-trip a caller's own shape", () => {
		expect(fromValueArray(toValueArray(30), false)).toBe(30);
		expect(fromValueArray(toValueArray([200, 800]), true)).toEqual([200, 800]);
	});

	test("copy rather than alias, so a write cannot reach the caller's array", () => {
		const source = [200, 800];
		const copied = toValueArray(source);
		copied[0] = 0;
		expect(source[0]).toBe(200);
	});

	test("survive an empty array without yielding undefined", () => {
		expect(fromValueArray([], false)).toBe(0);
	});
});

describe("progressOf", () => {
	test("maps the ends to 0 and 1", () => {
		expect(progressOf(0, 0, 100)).toBe(0);
		expect(progressOf(100, 0, 100)).toBe(1);
		expect(progressOf(50, 0, 100)).toBe(0.5);
	});

	test("clamps rather than extrapolating", () => {
		expect(progressOf(-20, 0, 100)).toBe(0);
		expect(progressOf(120, 0, 100)).toBe(1);
	});

	test("returns 0 for a degenerate range rather than dividing by zero", () => {
		expect(progressOf(5, 5, 5)).toBe(0);
		expect(progressOf(5, 10, 0)).toBe(0);
	});

	test("handles a range that does not start at zero", () => {
		expect(progressOf(-50, -100, 0)).toBe(0.5);
	});
});

describe("snapToStep", () => {
	test("lands on multiples measured from the minimum, not from zero", () => {
		expect(snapToStep(23, 10, 0, 100)).toBe(20);
		expect(snapToStep(26, 10, 0, 100)).toBe(30);
		// Offset from the minimum: the reachable values are 5, 15, 25 — not 10, 20.
		expect(snapToStep(13, 10, 5, 100)).toBe(15);
	});

	test("passes the value through when the step is zero or negative", () => {
		expect(snapToStep(23.7, 0, 0, 100)).toBe(23.7);
		expect(snapToStep(23.7, -1, 0, 100)).toBe(23.7);
	});

	test("never returns a value outside the range, at any step", () => {
		for (const step of [0, 0.1, 0.25, 1, 7, 10]) {
			for (const value of [-500, -1, 0, 33.3, 99.9, 100, 500]) {
				const snapped = snapToStep(value, step, 0, 100);
				expect(snapped).toBeGreaterThanOrEqual(0);
				expect(snapped).toBeLessThanOrEqual(100);
			}
		}
	});

	// A step the range does not divide evenly must not push the last stop past the
	// maximum — 0,7,14…98 then 100, never 105.
	test("clamps a step the range does not divide evenly", () => {
		expect(snapToStep(100, 7, 0, 100)).toBe(100);
		expect(snapToStep(99, 7, 0, 100)).toBe(98);
	});

	test("does not leak binary floating-point noise", () => {
		expect(snapToStep(0.3, 0.1, 0, 1)).toBe(0.3);
		expect(snapToStep(0.7, 0.1, 0, 1)).toBe(0.7);
		expect(snapToStep(0.26, 0.25, 0, 1)).toBe(0.25);
	});
});

describe("clampThumb", () => {
	test("holds a lone thumb inside the range", () => {
		expect(clampThumb(120, [50], 0, 0, 100)).toBe(100);
		expect(clampThumb(-20, [50], 0, 0, 100)).toBe(0);
	});

	test("stops a thumb at its neighbour rather than letting it cross", () => {
		expect(clampThumb(900, [200, 800], 0, 0, 1000)).toBe(800);
		expect(clampThumb(100, [200, 800], 1, 0, 1000)).toBe(200);
	});

	test("bounds the outer thumbs by the range and the inner ones by both sides", () => {
		expect(clampThumb(1200, [200, 500, 800], 2, 0, 1000)).toBe(1000);
		expect(clampThumb(-5, [200, 500, 800], 0, 0, 1000)).toBe(0);
		expect(clampThumb(900, [200, 500, 800], 1, 0, 1000)).toBe(800);
		expect(clampThumb(0, [200, 500, 800], 1, 0, 1000)).toBe(200);
	});

	// The property that matters: whatever a drag asks for, the order survives.
	test("never lets a thumb pass one of its neighbours, for any request", () => {
		const values = [200, 500, 800];
		for (const index of [0, 1, 2]) {
			for (const request of [-1000, 0, 199, 201, 499, 501, 799, 801, 1000, 5000]) {
				const next = clampThumb(request, values, index, 0, 1000);
				if (index > 0) expect(next).toBeGreaterThanOrEqual(values[index - 1] as number);
				if (index < values.length - 1) expect(next).toBeLessThanOrEqual(values[index + 1] as number);
				expect(next).toBeGreaterThanOrEqual(0);
				expect(next).toBeLessThanOrEqual(1000);
			}
		}
	});
});

describe("valueFromOffset", () => {
	test("maps a horizontal position across the travel", () => {
		expect(valueFromOffset({ position: 0, travel: 200, minValue: 0, maxValue: 100, isVertical: false })).toBe(0);
		expect(valueFromOffset({ position: 200, travel: 200, minValue: 0, maxValue: 100, isVertical: false })).toBe(100);
		expect(valueFromOffset({ position: 100, travel: 200, minValue: 0, maxValue: 100, isVertical: false })).toBe(50);
	});

	// Min at the bottom: a vertical track measures its offset from the top, so the
	// axis is inverted here and in exactly one other place, the translate's sign.
	test("inverts a vertical position, so the bottom is the minimum", () => {
		expect(valueFromOffset({ position: 0, travel: 200, minValue: 0, maxValue: 100, isVertical: true })).toBe(100);
		expect(valueFromOffset({ position: 200, travel: 200, minValue: 0, maxValue: 100, isVertical: true })).toBe(0);
		expect(valueFromOffset({ position: 150, travel: 200, minValue: 0, maxValue: 100, isVertical: true })).toBe(25);
	});

	test("clamps a position past either end", () => {
		expect(valueFromOffset({ position: -80, travel: 200, minValue: 0, maxValue: 100, isVertical: false })).toBe(0);
		expect(valueFromOffset({ position: 900, travel: 200, minValue: 0, maxValue: 100, isVertical: false })).toBe(100);
	});

	// Before the first layout the track has no size, and a division would be NaN —
	// which would poison the shared value and freeze the thumb for good.
	test("returns the minimum rather than NaN before the track has been measured", () => {
		expect(valueFromOffset({ position: 40, travel: 0, minValue: 0, maxValue: 100, isVertical: false })).toBe(0);
		expect(valueFromOffset({ position: 40, travel: -10, minValue: 5, maxValue: 100, isVertical: false })).toBe(5);
	});

	test("carries a range that does not start at zero", () => {
		expect(valueFromOffset({ position: 100, travel: 200, minValue: -100, maxValue: 100, isVertical: false })).toBe(0);
	});
});

describe("nearestThumbIndex", () => {
	test("picks the only thumb there is", () => {
		expect(nearestThumbIndex([50], 90)).toBe(0);
	});

	test("picks the closer of two", () => {
		expect(nearestThumbIndex([200, 800], 300)).toBe(0);
		expect(nearestThumbIndex([200, 800], 700)).toBe(1);
	});

	// A tie has to resolve the same way every time, or the thumb a press grabs at
	// the exact midpoint depends on nothing the caller can see.
	test("resolves a tie to the lower index, deterministically", () => {
		expect(nearestThumbIndex([200, 800], 500)).toBe(0);
		expect(nearestThumbIndex([0, 100], 50)).toBe(0);
	});

	test("never returns an index the array does not hold", () => {
		expect(nearestThumbIndex([], 50)).toBe(0);
		for (const target of [-100, 0, 33, 500, 1000]) {
			const index = nearestThumbIndex([200, 500, 800], target);
			expect(index).toBeGreaterThanOrEqual(0);
			expect(index).toBeLessThan(3);
		}
	});
});

describe("fillBounds", () => {
	// A lone thumb fills from the minimum; a range fills between its own thumbs.
	test("fills from the start for a lone thumb", () => {
		expect(fillBounds([25], 0, 100)).toEqual({ start: 0, end: 0.25 });
	});

	test("fills between the thumbs for a range", () => {
		expect(fillBounds([200, 800], 0, 1000)).toEqual({ start: 0.2, end: 0.8 });
	});

	// A caller who hands over a descending array gets a fill that still has a
	// positive extent, rather than one drawn backwards.
	test("spans the outermost thumbs however they are ordered", () => {
		expect(fillBounds([800, 200], 0, 1000)).toEqual({ start: 0.2, end: 0.8 });
	});

	test("never returns a negative extent", () => {
		for (const values of [[0], [100], [0, 0], [100, 0], [50, 50], []]) {
			const { start, end } = fillBounds(values, 0, 100);
			expect(end).toBeGreaterThanOrEqual(start);
			expect(start).toBeGreaterThanOrEqual(0);
			expect(end).toBeLessThanOrEqual(1);
		}
	});
});

describe("fillExtent", () => {
	// The thumb's diameter *is* the track's thickness, and these two properties are
	// the whole reason for that. Neither holds if the thumb is inset inside the
	// track: an inset leaves stray colour at the minimum and empty groove at the
	// maximum, at every size.
	test("draws exactly one thumb at the minimum, so no colour escapes it", () => {
		for (const thumbSize of [16, 20, 24]) {
			const { offset, extent } = fillExtent({ start: 0, end: 0, travel: 300, thumbSize, isRange: false });
			expect(offset).toBe(0);
			expect(extent).toBe(thumbSize);
		}
	});

	test("reaches the far end of the track at the maximum", () => {
		for (const thumbSize of [16, 20, 24]) {
			const travel = 300;
			const { offset, extent } = fillExtent({ start: 0, end: 1, travel, thumbSize, isRange: false });
			expect(offset + extent).toBe(travel + thumbSize);
		}
	});

	// A range starts at its own first thumb rather than at the track's edge, which
	// is what makes it read as a span rather than as a fill with a hole in it.
	test("starts a range at its first thumb, not at the track's edge", () => {
		const { offset, extent } = fillExtent({ start: 0.2, end: 0.8, travel: 300, thumbSize: 20, isRange: true });
		expect(offset).toBe(60);
		expect(extent).toBe(0.6 * 300 + 20);
	});

	test("fills the whole track for a range spanning it end to end", () => {
		const { offset, extent } = fillExtent({ start: 0, end: 1, travel: 300, thumbSize: 20, isRange: true });
		expect(offset).toBe(0);
		expect(offset + extent).toBe(320);
	});

	// Two thumbs dragged onto one another are still two thumbs. Collapsing to zero
	// would blink the fill out from under them.
	test("collapses a range to one thumb's width, never to nothing", () => {
		for (const at of [0, 0.5, 1]) {
			const { extent } = fillExtent({ start: at, end: at, travel: 300, thumbSize: 20, isRange: true });
			expect(extent).toBe(20);
		}
	});

	test("never returns a negative extent or an offset past the travel", () => {
		for (const start of [-0.5, 0, 0.3, 0.9, 1, 1.5]) {
			for (const end of [-0.5, 0, 0.3, 0.9, 1, 1.5]) {
				for (const isRange of [false, true]) {
					const { offset, extent } = fillExtent({ start, end, travel: 300, thumbSize: 20, isRange });
					expect(extent).toBeGreaterThanOrEqual(0);
					expect(offset).toBeGreaterThanOrEqual(0);
					expect(offset).toBeLessThanOrEqual(300);
					expect(offset + extent).toBeLessThanOrEqual(320);
				}
			}
		}
	});

	// A measured 0 means "not measured yet". Drawing anything then puts a garbage
	// bar on screen for a frame; dividing into it puts NaN on the UI thread, which
	// no later frame recovers from.
	test("draws nothing before the track has been measured", () => {
		for (const travel of [0, -20]) {
			expect(fillExtent({ start: 0, end: 0.5, travel, thumbSize: 20, isRange: false })).toEqual({
				offset: 0,
				extent: 0,
			});
		}
	});
});

describe("formatSliderValue", () => {
	test("formats a lone value", () => {
		expect(formatSliderValue([30])).toBe("30");
	});

	test("joins a range with the shared separator", () => {
		expect(formatSliderValue([200, 800])).toBe(`200${SLIDER_RANGE_SEPARATOR}800`);
	});

	test("carries the caller's format options through", () => {
		expect(formatSliderValue([1234.5], { maximumFractionDigits: 0 })).toBe("1,235");
	});

	// An en dash, not a hyphen: the separator is a range, and a hyphen beside a
	// negative number is unreadable.
	test("separates with an en dash", () => {
		expect(SLIDER_RANGE_SEPARATOR).toContain("–");
	});

	test("returns an empty string rather than throwing on no values", () => {
		expect(formatSliderValue([])).toBe("");
	});
});

describe("resolveSliderAxes", () => {
	test("falls back to the defaults when nothing names an axis", () => {
		expect(resolveSliderAxes({})).toEqual({
			color: SLIDER_DEFAULT_COLOR,
			size: SLIDER_DEFAULT_SIZE,
			orientation: SLIDER_DEFAULT_ORIENTATION,
			isDisabled: false,
			isInvalid: false,
		});
	});

	test("takes the slider's own props over everything", () => {
		const axes = resolveSliderAxes({
			own: { color: "success", size: "lg", orientation: "vertical", isDisabled: true, isInvalid: true },
			field: { isDisabled: false, isInvalid: false },
		});
		expect(axes).toEqual({
			color: "success",
			size: "lg",
			orientation: "vertical",
			isDisabled: true,
			isInvalid: true,
		});
	});

	test("inherits the two state axes from an enclosing Field", () => {
		const axes = resolveSliderAxes({ field: { isDisabled: true, isInvalid: true } });
		expect(axes.isDisabled).toBe(true);
		expect(axes.isInvalid).toBe(true);
	});

	// `??` and never `||`, so an explicit `false` is a value rather than an
	// absence — the rule `pressedScale` already follows.
	test("lets an explicit false opt out of a disabled or invalid Field", () => {
		const axes = resolveSliderAxes({
			own: { isDisabled: false, isInvalid: false },
			field: { isDisabled: true, isInvalid: true },
		});
		expect(axes.isDisabled).toBe(false);
		expect(axes.isInvalid).toBe(false);
	});

	// A Field carries no colour, size or orientation, so it must not be able to
	// reach them even if one were added to its context later.
	test("never takes a paint axis from a Field", () => {
		const axes = resolveSliderAxes({ field: { isDisabled: false, isInvalid: false } });
		expect(axes.color).toBe(SLIDER_DEFAULT_COLOR);
		expect(axes.size).toBe(SLIDER_DEFAULT_SIZE);
		expect(axes.orientation).toBe(SLIDER_DEFAULT_ORIENTATION);
	});
});

describe("the fill's colours", () => {
	// A slot pointing at a token no theme emits resolves to nothing and draws an
	// invisible fill — silently, since an unresolved variable is not an error.
	test("name a token both variants of the theme declare", () => {
		for (const color of SLIDER_COLORS) {
			const token = backgroundToken(cls(sliderVariants({ color }).fill()));
			expect(token).toBeDefined();
			expect(themeDeclarations(token as string)).toBe(2);
		}
		expect(themeDeclarations(backgroundToken(cls(sliderVariants({ isInvalid: true }).fill())) as string)).toBe(2);
	});

	// `default` and `primary` name different tokens this theme happens to tune to
	// the same value — `foreground` is the page's ink, `primary` is the brand's
	// action colour, and an app that re-themes one wants the other left alone. The
	// four semantic colours have no such excuse and must stay mutually distinct.
	test("keep the four semantic colours distinct from each other and from the neutrals", () => {
		const semantic = ["success", "warning", "danger", "info"] as const;
		const tokens = semantic.map((color) => backgroundToken(cls(sliderVariants({ color }).fill())));
		expect(new Set(tokens).size).toBe(semantic.length);
		expect(tokens).not.toContain(backgroundToken(cls(sliderVariants({ color: "default" }).fill())));
		expect(tokens).not.toContain(backgroundToken(cls(sliderVariants({ color: "primary" }).fill())));
	});

	// The groove has to read as empty at every colour, so it must not accidentally
	// be painted in whatever the fill is wearing.
	test("never paint the fill in the track's own colour", () => {
		const track = backgroundToken(cls(sliderVariants({}).track()));
		for (const color of SLIDER_COLORS) {
			expect(backgroundToken(cls(sliderVariants({ color }).fill()))).not.toBe(track);
		}
	});
});

describe("both ends of the range", () => {
	// Dragging all the way to the end must reach the maximum the caller wrote,
	// even when the step does not divide the range — see snapToStep.
	test("are reachable at any step", () => {
		for (const step of [0, 0.1, 1, 3, 7, 33]) {
			expect(snapToStep(1000, step, 0, 100)).toBe(100);
			expect(snapToStep(-1000, step, 0, 100)).toBe(0);
		}
	});

	test("do not add an extra stop anywhere but at the end", () => {
		// 0, 7, 14 … 98, then 100. Nothing between 90 and 98 becomes 100.
		expect(snapToStep(92, 7, 0, 100)).toBe(91);
		expect(snapToStep(95, 7, 0, 100)).toBe(98);
	});
});

describe("the two orientations", () => {
	// The inversion lives in exactly one place. This is the test that keeps the
	// vertical branch from drifting into a second, hand-written axis: reading a
	// vertical track from the far end must give the same value as reading a
	// horizontal one from the near end.
	test("are mirror images of one another", () => {
		const travel = 240;
		for (const position of [0, 1, 60, 120, 180, 239, 240]) {
			const horizontal = valueFromOffset({ position, travel, minValue: 0, maxValue: 100, isVertical: false });
			const vertical = valueFromOffset({
				position: travel - position,
				travel,
				minValue: 0,
				maxValue: 100,
				isVertical: true,
			});
			expect(vertical).toBeCloseTo(horizontal, 10);
		}
	});
});

describe("shouldTickHaptic", () => {
	const base = { step: 1, snapped: 50, lastSnapped: 49, position: 100, lastPosition: 0, minValue: 0, maxValue: 100 };

	test("ticks when the value crosses a step", () => {
		expect(shouldTickHaptic(base)).toBe(true);
	});

	// A continuous slider has no stop to land on, so a tick would be reporting the
	// refresh rate rather than the value.
	test("never ticks a continuous slider", () => {
		expect(shouldTickHaptic({ ...base, step: 0 })).toBe(false);
	});

	test("stays quiet while the value has not changed", () => {
		expect(shouldTickHaptic({ ...base, snapped: 49 })).toBe(false);
	});

	// The rate limit: a flick across a fine step scale would otherwise fire a
	// hundred times in a fifth of a second, which is a buzz rather than ticks.
	test("thins out a fine step scale by distance travelled", () => {
		expect(shouldTickHaptic({ ...base, position: SLIDER_HAPTIC_MIN_TRAVEL - 1 })).toBe(false);
		expect(shouldTickHaptic({ ...base, position: SLIDER_HAPTIC_MIN_TRAVEL })).toBe(true);
	});

	test("always ticks at either end, however fast the drag arrived", () => {
		expect(shouldTickHaptic({ ...base, snapped: 0, position: 1 })).toBe(true);
		expect(shouldTickHaptic({ ...base, snapped: 100, position: 1 })).toBe(true);
	});

	test("does not tick at an end the slider was already resting on", () => {
		expect(shouldTickHaptic({ ...base, snapped: 100, lastSnapped: 100, position: 1 })).toBe(false);
	});

	test("keeps the travel gate positive whichever way the drag is going", () => {
		expect(shouldTickHaptic({ ...base, position: 0, lastPosition: SLIDER_HAPTIC_MIN_TRAVEL })).toBe(true);
	});
});
