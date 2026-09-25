import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import { SLIDER_COLORS, SLIDER_OUTPUT_TEXT_SIZE, SLIDER_SIZES } from "../slider/slider.variants";
import { TEXT_SIZES } from "../text/text.variants";
import {
	fillTranslate,
	formatProgressValue,
	indeterminateSegment,
	PROGRESS_COLORS,
	PROGRESS_DEFAULT_COLOR,
	PROGRESS_DEFAULT_SIZE,
	PROGRESS_FILL_DURATION_MS,
	PROGRESS_INDETERMINATE_DURATION_MS,
	PROGRESS_INDETERMINATE_SEGMENT,
	PROGRESS_MAX_VALUE,
	PROGRESS_MIN_VALUE,
	PROGRESS_OUTPUT_TEXT_SIZE,
	PROGRESS_PULSE,
	PROGRESS_SIZES,
	progressRatio,
	progressVariants,
	resolveProgressAccessibility,
	resolveProgressAxes,
} from "./progress.variants";

/** The bare colour a `bg-*` class names — `bg-success` yields `success`. */
function backgroundToken(value: string): string | undefined {
	return value.match(/\bbg-([\w-]+)\b/)?.[1];
}

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The `h-*` step a class string sets — `h-1.5` yields 1.5. */
function heightStep(value: string): number {
	return Number(value.match(/\bh-(\d+(?:\.\d+)?)\b/)?.[1]);
}

describe("the theme reader", () => {
	// Guard: every token assertion below is worthless if the parse found nothing.
	test("finds both variants of the theme", () => {
		expect(declarationCount("primary")).toBe(2);
	});
});

describe("the axes", () => {
	// A meter stacked on this bar, and a slider beside it, have to be able to
	// name the same colour and the same size with the same word.
	test("share the slider's six colours and three sizes", () => {
		expect([...PROGRESS_COLORS]).toEqual([...SLIDER_COLORS]);
		expect([...PROGRESS_SIZES]).toEqual([...SLIDER_SIZES]);
	});

	test("default to values the axes actually hold", () => {
		expect(PROGRESS_COLORS).toContain(PROGRESS_DEFAULT_COLOR);
		expect(PROGRESS_SIZES).toContain(PROGRESS_DEFAULT_SIZE);
	});

	test("default the range to 0–100", () => {
		expect(PROGRESS_MIN_VALUE).toBe(0);
		expect(PROGRESS_MAX_VALUE).toBe(100);
	});
});

describe("resolveProgressAxes", () => {
	test("falls back to the defaults", () => {
		expect(resolveProgressAxes({})).toEqual({
			color: PROGRESS_DEFAULT_COLOR,
			isIndeterminate: false,
			size: PROGRESS_DEFAULT_SIZE,
		});
	});

	test("keeps what the call site named", () => {
		expect(resolveProgressAxes({ color: "success", isIndeterminate: true, size: "lg" })).toEqual({
			color: "success",
			isIndeterminate: true,
			size: "lg",
		});
	});

	// The progress bar is not a form control, so an enclosing Field has nothing
	// to hand it. The resolver takes no second argument, and this pins that.
	test("takes the call site alone", () => {
		expect(resolveProgressAxes.length).toBe(1);
	});
});

describe("progressVariants", () => {
	test("paints the fill differently for every colour", () => {
		const painted = new Set(PROGRESS_COLORS.map((color) => cls(progressVariants({ color }).fill())));
		expect(painted.size).toBe(PROGRESS_COLORS.length);
	});

	test("never paints the track in a colour", () => {
		const tracks = new Set(PROGRESS_COLORS.map((color) => cls(progressVariants({ color }).track())));
		expect(tracks.size).toBe(1);
	});

	test("names only tokens both variants of the theme declare", () => {
		const tokens = [
			backgroundToken(cls(progressVariants({}).track())),
			...PROGRESS_COLORS.map((color) => backgroundToken(cls(progressVariants({ color }).fill()))),
		];
		for (const token of tokens) {
			expect(token).toBeDefined();
			expect(declarationCount(token as string)).toBe(2);
		}
	});

	test("never paints the fill in the track's own colour", () => {
		const track = backgroundToken(cls(progressVariants({}).track()));
		for (const color of PROGRESS_COLORS) {
			expect(backgroundToken(cls(progressVariants({ color }).fill()))).not.toBe(track);
		}
	});

	test("thickens the track as the size steps up", () => {
		const heights = PROGRESS_SIZES.map((size) => heightStep(cls(progressVariants({ size }).track())));
		for (const height of heights) expect(Number.isFinite(height)).toBe(true);
		expect([...heights].sort((a, b) => a - b)).toEqual(heights);
		expect(new Set(heights).size).toBe(heights.length);
	});

	// The fill slides under the track's rounded clip; a track that stops clipping
	// shows the fill parked to its left at every value below the maximum.
	test("clips the fill to the track", () => {
		expect(cls(progressVariants({}).track())).toMatch(/\boverflow-hidden\b/);
		expect(cls(progressVariants({}).fill())).toMatch(/\babsolute\b/);
	});

	// No slot worn by a View carries type — the readout names a Text step instead.
	test("puts no text styling on a View slot", () => {
		for (const size of PROGRESS_SIZES) {
			const slots = progressVariants({ size });
			for (const slot of [slots.root(), slots.track(), slots.fill()]) {
				expect(cls(slot)).not.toMatch(/\b(text|font)-/);
			}
		}
	});
});

describe("PROGRESS_OUTPUT_TEXT_SIZE", () => {
	test("names a size Text actually has, for every progress size", () => {
		for (const size of PROGRESS_SIZES) {
			expect(TEXT_SIZES).toContain(PROGRESS_OUTPUT_TEXT_SIZE[size]);
		}
	});

	// A progress bar under a slider in one form reads at the same type step.
	test("matches the slider's readout", () => {
		expect(PROGRESS_OUTPUT_TEXT_SIZE).toEqual(SLIDER_OUTPUT_TEXT_SIZE);
	});
});

describe("the motion constants", () => {
	test("are positive and ordered the way the eye reads them", () => {
		expect(PROGRESS_FILL_DURATION_MS).toBeGreaterThan(0);
		expect(PROGRESS_INDETERMINATE_DURATION_MS).toBeGreaterThan(PROGRESS_FILL_DURATION_MS);
	});

	test("keep the indeterminate segment a strict fraction of the track", () => {
		expect(PROGRESS_INDETERMINATE_SEGMENT).toBeGreaterThan(0);
		expect(PROGRESS_INDETERMINATE_SEGMENT).toBeLessThan(1);
	});

	// A pulse that dims to nothing reads as the bar disappearing, not breathing.
	test("never pulses to fully transparent", () => {
		expect(PROGRESS_PULSE.from).toBeGreaterThan(0);
		expect(PROGRESS_PULSE.to).toBe(1);
		expect(PROGRESS_PULSE.from).toBeLessThan(PROGRESS_PULSE.to);
		expect(PROGRESS_PULSE.durationMs).toBeGreaterThan(0);
	});
});

describe("progressRatio", () => {
	test("maps the range onto 0–1", () => {
		expect(progressRatio(0, 0, 100)).toBe(0);
		expect(progressRatio(25, 0, 100)).toBe(0.25);
		expect(progressRatio(100, 0, 100)).toBe(1);
		expect(progressRatio(18, 0, 24)).toBe(0.75);
		expect(progressRatio(15, 10, 20)).toBe(0.5);
	});

	test("clamps rather than extrapolating", () => {
		expect(progressRatio(-5, 0, 100)).toBe(0);
		expect(progressRatio(150, 0, 100)).toBe(1);
	});

	// NaN in a shared value freezes the fill for good — no later frame recovers.
	test("returns 0 for a degenerate range or a value that is not a number", () => {
		expect(progressRatio(5, 10, 10)).toBe(0);
		expect(progressRatio(5, 20, 10)).toBe(0);
		expect(progressRatio(Number.NaN, 0, 100)).toBe(0);
		expect(progressRatio(Number.POSITIVE_INFINITY, 0, 100)).toBe(0);
	});
});

describe("fillTranslate", () => {
	test("parks the full-length fill left of the track by what is still to go", () => {
		expect(fillTranslate({ ratio: 0, trackSize: 200 })).toBe(-200);
		expect(fillTranslate({ ratio: 0.25, trackSize: 200 })).toBe(-150);
		expect(fillTranslate({ ratio: 1, trackSize: 200 })).toBe(0);
	});

	test("clamps a ratio outside 0–1", () => {
		expect(fillTranslate({ ratio: -1, trackSize: 200 })).toBe(-200);
		expect(fillTranslate({ ratio: 2, trackSize: 200 })).toBe(0);
	});

	// An unmeasured track is 0 wide; the bar is hidden until it is measured.
	test("is 0 for an unmeasured track", () => {
		expect(fillTranslate({ ratio: 0.5, trackSize: 0 })).toBe(0);
	});
});

describe("indeterminateSegment", () => {
	test("sizes the segment as a fraction of the track", () => {
		expect(indeterminateSegment({ phase: 0, segment: 0.4, trackSize: 200 }).width).toBe(80);
	});

	// Both ends of the loop are off-track, so the seam where it repeats is never
	// on screen.
	test("starts wholly left of the track and ends wholly right of it", () => {
		const start = indeterminateSegment({ phase: 0, segment: 0.4, trackSize: 200 });
		const end = indeterminateSegment({ phase: 1, segment: 0.4, trackSize: 200 });
		expect(start.translate + start.width).toBe(0);
		expect(end.translate).toBe(200);
	});

	test("moves monotonically", () => {
		let last = Number.NEGATIVE_INFINITY;
		for (let phase = 0; phase <= 1; phase += 0.1) {
			const { translate } = indeterminateSegment({ phase, segment: 0.4, trackSize: 200 });
			expect(translate).toBeGreaterThan(last);
			last = translate;
		}
	});

	test("draws nothing on an unmeasured track", () => {
		expect(indeterminateSegment({ phase: 0.5, segment: 0.4, trackSize: 0 })).toEqual({ translate: 0, width: 0 });
	});
});

describe("formatProgressValue", () => {
	test("reads as a whole percentage of the range by default", () => {
		expect(formatProgressValue({ maxValue: 100, minValue: 0, value: 72 })).toBe("72%");
		expect(formatProgressValue({ maxValue: 24, minValue: 0, value: 18 })).toBe("75%");
		expect(formatProgressValue({ maxValue: 100, minValue: 0, value: 33.4 })).toBe("33%");
	});

	test("clamps the percentage the way the fill clamps", () => {
		expect(formatProgressValue({ maxValue: 100, minValue: 0, value: 140 })).toBe("100%");
	});

	test("formats the value itself when given a non-percent style", () => {
		const formatted = formatProgressValue({
			formatOptions: { currency: "NZD", maximumFractionDigits: 0, style: "currency" },
			maxValue: 2000,
			minValue: 0,
			value: 1250,
		});
		expect(formatted).toMatch(/1,250/);
		expect(formatted).not.toMatch(/%/);
	});

	// `style: "percent"` would print 7200% if it formatted the value, so a percent
	// style still formats the ratio — with the caller's other options applied.
	test("keeps formatting the ratio under a percent style", () => {
		expect(
			formatProgressValue({
				formatOptions: { maximumFractionDigits: 1, style: "percent" },
				maxValue: 1000,
				minValue: 0,
				value: 125,
			})
		).toBe("12.5%");
	});
});

describe("resolveProgressAccessibility", () => {
	test("reports the range and the value for a determinate bar", () => {
		expect(resolveProgressAccessibility({ isIndeterminate: false, maxValue: 100, minValue: 0, value: 72 })).toEqual({
			busy: false,
			value: { max: 100, min: 0, now: 72, text: "72%" },
		});
	});

	// "18 of 24" says more than "75%": the count is what the screen is about.
	test("reads a count as value of maximum when the range is not 0–100", () => {
		expect(
			resolveProgressAccessibility({ isIndeterminate: false, maxValue: 24, minValue: 0, value: 18 }).value
		).toEqual({ max: 24, min: 0, now: 18, text: "18 of 24" });
	});

	test("speaks a formatted value when the readout formats one", () => {
		const { value } = resolveProgressAccessibility({
			formatOptions: { currency: "NZD", maximumFractionDigits: 0, style: "currency" },
			isIndeterminate: false,
			maxValue: 2000,
			minValue: 0,
			value: 1250,
		});
		expect(value?.text).toMatch(/1,250 of .*2,000/);
	});

	test("prefers the caller's own words", () => {
		expect(
			resolveProgressAccessibility({
				isIndeterminate: false,
				maxValue: 10,
				minValue: 0,
				value: 3,
				valueLabel: "Step 3 of 10",
			}).value?.text
		).toBe("Step 3 of 10");
	});

	test("clamps the reported value into the range", () => {
		expect(
			resolveProgressAccessibility({ isIndeterminate: false, maxValue: 100, minValue: 0, value: 130 }).value?.now
		).toBe(100);
	});

	// An indeterminate bar has no value to report, and a `now` of 0 would be read
	// out as "zero percent" — which is a lie about work that is under way.
	test("reports busy and no value while indeterminate", () => {
		expect(resolveProgressAccessibility({ isIndeterminate: true, maxValue: 100, minValue: 0, value: 40 })).toEqual({
			busy: true,
			value: undefined,
		});
	});
});
