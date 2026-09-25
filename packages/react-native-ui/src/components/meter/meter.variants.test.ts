import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import {
	PROGRESS_COLORS,
	PROGRESS_DEFAULT_COLOR,
	PROGRESS_DEFAULT_SIZE,
	PROGRESS_SIZES,
	progressVariants,
} from "../progress/progress.variants";
import {
	litSegments,
	METER_COLORS,
	METER_DEFAULT_COLOR,
	METER_DEFAULT_SIZE,
	METER_MAX_SEGMENTS,
	METER_MAX_VALUE,
	METER_MIN_VALUE,
	METER_REGION_COLORS,
	METER_REGIONS,
	METER_SIZES,
	meterRange,
	meterSegmentCount,
	meterValue,
	meterVariants,
	resolveMeterAxes,
	resolveMeterColor,
	resolveMeterRegion,
	resolveMeterScale,
	resolveMeterValueLabel,
	thresholdColor,
} from "./meter.variants";

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

describe("the axes", () => {
	// A meter is a progress bar whose colour is a judgement, so the two have to
	// name a colour and a size with the same word.
	test("are the progress bar's colours and sizes", () => {
		expect([...METER_COLORS]).toEqual([...PROGRESS_COLORS]);
		expect([...METER_SIZES]).toEqual([...PROGRESS_SIZES]);
		expect(METER_DEFAULT_COLOR).toBe(PROGRESS_DEFAULT_COLOR);
		expect(METER_DEFAULT_SIZE).toBe(PROGRESS_DEFAULT_SIZE);
	});

	test("default the scale to 0–100", () => {
		expect(METER_MIN_VALUE).toBe(0);
		expect(METER_MAX_VALUE).toBe(100);
	});

	test("paint every region in a colour the meter has", () => {
		for (const region of METER_REGIONS) expect(METER_COLORS).toContain(METER_REGION_COLORS[region]);
	});

	// Good, worse and worst have to read as three different things at a glance.
	test("give every region its own colour", () => {
		expect(new Set(METER_REGIONS.map((region) => METER_REGION_COLORS[region])).size).toBe(METER_REGIONS.length);
		expect(METER_REGION_COLORS.optimum).toBe("success");
		expect(METER_REGION_COLORS.suboptimum).toBe("warning");
		expect(METER_REGION_COLORS.critical).toBe("destructive");
	});
});

describe("resolveMeterAxes", () => {
	test("falls back to the defaults", () => {
		expect(resolveMeterAxes({})).toEqual({ color: METER_DEFAULT_COLOR, size: METER_DEFAULT_SIZE });
	});

	test("keeps what the call site named", () => {
		expect(resolveMeterAxes({ color: "info", size: "lg" })).toEqual({ color: "info", size: "lg" });
	});

	// A meter reports; it is not a form control, so a Field has nothing to hand it.
	test("takes the call site alone", () => {
		expect(resolveMeterAxes.length).toBe(1);
	});
});

describe("meterRange", () => {
	test("keeps a finite, ordered scale", () => {
		expect(meterRange(0, 256)).toEqual({ maxValue: 256, minValue: 0 });
		expect(meterRange(-10, 10)).toEqual({ maxValue: 10, minValue: -10 });
	});

	test("falls back to 0–100 for a bound that is not a finite number", () => {
		expect(meterRange(Number.NaN, 50)).toEqual({ maxValue: 50, minValue: 0 });
		expect(meterRange(0, Number.POSITIVE_INFINITY)).toEqual({ maxValue: 100, minValue: 0 });
	});

	// An inverted or empty scale collapses at its floor and reads as empty,
	// rather than handing a negative span to the fill.
	test("collapses an inverted or empty scale at its floor", () => {
		expect(meterRange(50, 10)).toEqual({ maxValue: 50, minValue: 50 });
		expect(meterRange(20, 20)).toEqual({ maxValue: 20, minValue: 20 });
	});
});

describe("meterValue", () => {
	test("keeps a value inside the scale", () => {
		expect(meterValue(64, 0, 100)).toBe(64);
	});

	test("clamps to the ends of the scale", () => {
		expect(meterValue(-5, 0, 100)).toBe(0);
		expect(meterValue(300, 0, 256)).toBe(256);
	});

	// NaN in a shared value freezes the fill; infinity is a direction, so it
	// reads at the end it points to rather than at the floor.
	test("reads NaN at the floor and infinities at their end", () => {
		expect(meterValue(Number.NaN, 0, 100)).toBe(0);
		expect(meterValue(Number.POSITIVE_INFINITY, 0, 100)).toBe(100);
		expect(meterValue(Number.NEGATIVE_INFINITY, 10, 100)).toBe(10);
	});
});

describe("resolveMeterRegion", () => {
	// A disk: filling is fine, nearly full is a warning, full is a problem.
	const disk = { high: 90, low: 70, maxValue: 100, minValue: 0, optimum: 0 };

	test("with the optimum below low, the bottom of the scale is good", () => {
		expect(resolveMeterRegion({ ...disk, value: 40 })).toBe("optimum");
		expect(resolveMeterRegion({ ...disk, value: 70 })).toBe("suboptimum");
		expect(resolveMeterRegion({ ...disk, value: 90 })).toBe("suboptimum");
		expect(resolveMeterRegion({ ...disk, value: 95 })).toBe("critical");
	});

	// A battery: the same thresholds, read the other way up.
	const battery = { high: 50, low: 20, maxValue: 100, minValue: 0, optimum: 100 };

	test("with the optimum above high, the top of the scale is good", () => {
		expect(resolveMeterRegion({ ...battery, value: 80 })).toBe("optimum");
		expect(resolveMeterRegion({ ...battery, value: 50 })).toBe("suboptimum");
		expect(resolveMeterRegion({ ...battery, value: 20 })).toBe("suboptimum");
		expect(resolveMeterRegion({ ...battery, value: 10 })).toBe("critical");
	});

	// A room's temperature: good in a band, too cold and too hot are alike.
	const room = { high: 24, low: 18, maxValue: 35, minValue: 5, optimum: 21 };

	test("with the optimum between low and high, the band is good and both sides are worse", () => {
		expect(resolveMeterRegion({ ...room, value: 21 })).toBe("optimum");
		expect(resolveMeterRegion({ ...room, value: 18 })).toBe("optimum");
		expect(resolveMeterRegion({ ...room, value: 24 })).toBe("optimum");
		expect(resolveMeterRegion({ ...room, value: 12 })).toBe("suboptimum");
		expect(resolveMeterRegion({ ...room, value: 30 })).toBe("suboptimum");
	});

	test("defaults low and high to the scale's ends and the optimum to its middle", () => {
		expect(resolveMeterRegion({ maxValue: 100, minValue: 0, value: 3 })).toBe("optimum");
		expect(resolveMeterRegion({ maxValue: 100, minValue: 0, value: 97 })).toBe("optimum");
		// Only `high` given: above it is worse, and there is nothing below.
		expect(resolveMeterRegion({ high: 80, maxValue: 100, minValue: 0, value: 85 })).toBe("suboptimum");
	});

	// A boundary outside the scale, or `high` under `low`, is pulled into order
	// rather than inverting every region.
	test("clamps boundaries into the scale and into order", () => {
		expect(resolveMeterRegion({ high: 500, low: -20, maxValue: 100, minValue: 0, value: 99 })).toBe("optimum");
		expect(resolveMeterRegion({ high: 10, low: 60, maxValue: 100, minValue: 0, optimum: 0, value: 50 })).toBe(
			"optimum"
		);
		expect(resolveMeterRegion({ high: 10, low: 60, maxValue: 100, minValue: 0, optimum: 0, value: 70 })).toBe(
			"critical"
		);
	});

	test("reads a value outside the scale where it clamps to", () => {
		expect(resolveMeterRegion({ ...disk, value: 400 })).toBe("critical");
		expect(resolveMeterRegion({ ...battery, value: Number.NaN })).toBe("critical");
	});
});

describe("thresholdColor", () => {
	const thresholds = [
		{ color: "warning", from: 70 },
		{ color: "destructive", from: 90 },
		{ color: "success", from: 0 },
	] as const;

	test("picks the highest threshold the value has reached, in any order", () => {
		expect(thresholdColor(10, thresholds)).toBe("success");
		expect(thresholdColor(70, thresholds)).toBe("warning");
		expect(thresholdColor(89.9, thresholds)).toBe("warning");
		expect(thresholdColor(95, thresholds)).toBe("destructive");
	});

	test("is undefined below every threshold, and for none", () => {
		expect(thresholdColor(-1, thresholds)).toBeUndefined();
		expect(thresholdColor(50, [])).toBeUndefined();
	});

	test("ignores a threshold that is not a finite number", () => {
		expect(thresholdColor(50, [{ color: "destructive", from: Number.NaN }])).toBeUndefined();
		expect(
			thresholdColor(50, [
				{ color: "info", from: 10 },
				{ color: "destructive", from: Number.NEGATIVE_INFINITY },
			])
		).toBe("info");
	});

	// Thresholds climbing to red suit a disk; falling to red suit a battery.
	test("lets either direction be the bad one", () => {
		const battery = [
			{ color: "destructive", from: 0 },
			{ color: "warning", from: 20 },
			{ color: "success", from: 50 },
		] as const;
		expect(thresholdColor(8, battery)).toBe("destructive");
		expect(thresholdColor(35, battery)).toBe("warning");
		expect(thresholdColor(80, battery)).toBe("success");
	});
});

describe("resolveMeterScale", () => {
	test("is plain with nothing to judge by", () => {
		expect(resolveMeterScale({})).toEqual({ kind: "plain" });
	});

	test("reads regions from any of low, high and optimum", () => {
		expect(resolveMeterScale({ high: 80 })).toEqual({ high: 80, kind: "regions", low: undefined, optimum: undefined });
		expect(resolveMeterScale({ optimum: 0 })).toEqual({
			high: undefined,
			kind: "regions",
			low: undefined,
			optimum: 0,
		});
	});

	test("reads thresholds when given them", () => {
		const thresholds = [{ color: "warning", from: 50 }] as const;
		expect(resolveMeterScale({ thresholds })).toEqual({ kind: "thresholds", thresholds });
	});
});

describe("resolveMeterColor", () => {
	const range = { maxValue: 100, minValue: 0 };

	test("is the colour prop, with no region, on a plain scale", () => {
		expect(resolveMeterColor({ ...range, color: "info", scale: { kind: "plain" }, value: 90 })).toEqual({
			color: "info",
			region: null,
		});
	});

	test("paints the region, whatever the colour prop says", () => {
		const scale = { high: 90, kind: "regions", low: 70, optimum: 0 } as const;
		expect(resolveMeterColor({ ...range, color: "info", scale, value: 40 })).toEqual({
			color: "success",
			region: "optimum",
		});
		expect(resolveMeterColor({ ...range, color: "info", scale, value: 80 })).toEqual({
			color: "warning",
			region: "suboptimum",
		});
		expect(resolveMeterColor({ ...range, color: "info", scale, value: 99 })).toEqual({
			color: "destructive",
			region: "critical",
		});
	});

	test("paints the reached threshold, and the colour prop below all of them", () => {
		const scale = { kind: "thresholds", thresholds: [{ color: "warning", from: 60 }] } as const;
		expect(resolveMeterColor({ ...range, color: "primary", scale, value: 75 })).toEqual({
			color: "warning",
			region: null,
		});
		expect(resolveMeterColor({ ...range, color: "primary", scale, value: 30 })).toEqual({
			color: "primary",
			region: null,
		});
	});

	test("judges the clamped value", () => {
		const scale = { kind: "thresholds", thresholds: [{ color: "destructive", from: 100 }] } as const;
		expect(resolveMeterColor({ ...range, color: "primary", scale, value: 250 }).color).toBe("destructive");
	});
});

describe("meterSegmentCount", () => {
	test("is null — a continuous bar — when no count is given", () => {
		expect(meterSegmentCount(undefined)).toBeNull();
	});

	test("rounds a fractional count down", () => {
		expect(meterSegmentCount(4)).toBe(4);
		expect(meterSegmentCount(4.8)).toBe(4);
	});

	test("clamps a count above the maximum", () => {
		expect(meterSegmentCount(5000)).toBe(METER_MAX_SEGMENTS);
	});

	test("falls back to the continuous bar for a count below one or not a number", () => {
		expect(meterSegmentCount(0)).toBeNull();
		expect(meterSegmentCount(0.6)).toBeNull();
		expect(meterSegmentCount(-3)).toBeNull();
		expect(meterSegmentCount(Number.NaN)).toBeNull();
		expect(meterSegmentCount(Number.POSITIVE_INFINITY)).toBeNull();
	});
});

describe("litSegments", () => {
	test("lights whole blocks only", () => {
		expect(litSegments({ count: 4, ratio: 0 })).toBe(0);
		expect(litSegments({ count: 4, ratio: 0.5 })).toBe(2);
		expect(litSegments({ count: 4, ratio: 0.74 })).toBe(2);
		expect(litSegments({ count: 4, ratio: 0.75 })).toBe(3);
		expect(litSegments({ count: 4, ratio: 1 })).toBe(4);
	});

	// "A little" must never look like "none" — rounding down would leave the
	// first quarter of a four-block meter dark.
	test("lights at least one block for any reading above the floor", () => {
		expect(litSegments({ count: 4, ratio: 0.01 })).toBe(1);
		expect(litSegments({ count: 10, ratio: 0.0001 })).toBe(1);
	});

	// Floating-point error must not leave the last block dark on a full meter.
	test("lights every block on a full reading reached by arithmetic", () => {
		expect(litSegments({ count: 3, ratio: (0.1 + 0.2) / 0.3 })).toBe(3);
		expect(litSegments({ count: 10, ratio: 0.7 })).toBe(7);
	});

	test("clamps the ratio", () => {
		expect(litSegments({ count: 5, ratio: 2 })).toBe(5);
		expect(litSegments({ count: 5, ratio: -1 })).toBe(0);
	});
});

describe("meterVariants", () => {
	test("paints a lit block differently for every colour", () => {
		const painted = new Set(METER_COLORS.map((color) => cls(meterVariants({ color }).segmentFill())));
		expect(painted.size).toBe(METER_COLORS.length);
	});

	// An unlit block is the progress bar's groove, so a segmented meter and a
	// continuous one in one card read as the same instrument.
	test("draws an unlit block as the progress track's groove", () => {
		const groove = backgroundToken(cls(progressVariants({}).track()));
		for (const color of METER_COLORS) {
			expect(backgroundToken(cls(meterVariants({ color }).segment()))).toBe(groove);
		}
	});

	test("paints a lit block in the progress fill's colour", () => {
		for (const color of METER_COLORS) {
			expect(backgroundToken(cls(meterVariants({ color }).segmentFill()))).toBe(
				backgroundToken(cls(progressVariants({ color }).fill()))
			);
		}
	});

	test("names only tokens both variants of the theme declare", () => {
		for (const color of METER_COLORS) {
			const token = backgroundToken(cls(meterVariants({ color }).segmentFill()));
			expect(token).toBeDefined();
			expect(declarationCount(token as string)).toBe(2);
		}
	});

	test("makes a block as thick as the progress track at every size", () => {
		for (const size of METER_SIZES) {
			expect(heightStep(cls(meterVariants({ size }).segment()))).toBe(
				heightStep(cls(progressVariants({ size }).track()))
			);
		}
	});

	// The lit fill sits over its block and fades in; it must not change the
	// block's size.
	test("lays the lit fill over its block", () => {
		expect(cls(meterVariants({}).segment())).toMatch(/\boverflow-hidden\b/);
		expect(cls(meterVariants({}).segmentFill())).toMatch(/\babsolute\b/);
		expect(cls(meterVariants({}).segments())).toMatch(/\bflex-row\b/);
	});

	test("puts no text styling on a View slot", () => {
		for (const size of METER_SIZES) {
			const slots = meterVariants({ size });
			for (const slot of [slots.segments(), slots.segment(), slots.segmentFill()]) {
				expect(cls(slot)).not.toMatch(/\b(text|font)-/);
			}
		}
	});
});

describe("resolveMeterValueLabel", () => {
	const reading = {
		color: "warning",
		formatted: "82%",
		maxValue: 100,
		minValue: 0,
		ratio: 0.82,
		region: "suboptimum",
		value: 82,
	} as const;

	test("is undefined with none, so the formatted reading stands", () => {
		expect(resolveMeterValueLabel(undefined, reading)).toBeUndefined();
	});

	test("keeps a string as given", () => {
		expect(resolveMeterValueLabel("Almost full", reading)).toBe("Almost full");
	});

	// The region has to reach the screen reader as words, and a hidden readout
	// never does — so the label, which is spoken, can be computed from it.
	test("calls a function with the judged reading", () => {
		expect(
			resolveMeterValueLabel(
				({ formatted, region }) => `${region === "suboptimum" ? "Filling up" : "OK"} · ${formatted}`,
				reading
			)
		).toBe("Filling up · 82%");
	});
});
