import { describe, expect, test } from "bun:test";
import {
	PAGING_COMMIT_DISTANCE,
	PAGING_COMMIT_VELOCITY,
	PAGING_RUBBER_BAND_MAX,
	resolveIndexFromPosition,
	resolveNearestPosition,
	resolvePanOrigin,
	resolvePanPosition,
	resolveRubberBand,
	resolveSettleTarget,
	resolveVisibleRange,
	resolveWrappedOffset,
} from "./paging";

const RUBBER_HALF = resolveRubberBand(0.5);

describe("resolveWrappedOffset", () => {
	test("is the plain distance when no wrap is shorter", () => {
		expect(resolveWrappedOffset(0, 0.2, 5)).toBeCloseTo(-0.2);
		expect(resolveWrappedOffset(2, 2, 5)).toBe(0);
	});

	test("takes the short way round the ring", () => {
		expect(resolveWrappedOffset(4, 0.2, 5)).toBeCloseTo(-1.2);
		expect(resolveWrappedOffset(1, 4.5, 5)).toBeCloseTo(1.5);
	});

	test("stays inside half the ring either side", () => {
		for (let position = -7; position <= 7; position += 0.35) {
			for (let i = 0; i < 6; i++) {
				const offset = resolveWrappedOffset(i, position, 6);
				expect(Math.abs(offset)).toBeLessThanOrEqual(3 + 1e-9);
			}
		}
	});

	test("is the same for positions a whole ring apart", () => {
		expect(resolveWrappedOffset(3, 1.25, 5)).toBeCloseTo(resolveWrappedOffset(3, 6.25, 5));
		expect(resolveWrappedOffset(3, 1.25, 5)).toBeCloseTo(resolveWrappedOffset(3, -3.75, 5));
	});

	test("one slide, or none, never wraps", () => {
		expect(resolveWrappedOffset(0, 0, 1)).toBe(0);
		expect(resolveWrappedOffset(0, 0, 0)).toBe(0);
	});
});

describe("resolveIndexFromPosition", () => {
	test("wraps the nearest slide round the ring when looping", () => {
		expect(resolveIndexFromPosition(4.6, 5, true)).toBe(0);
		expect(resolveIndexFromPosition(-0.4, 5, true)).toBe(0);
		expect(resolveIndexFromPosition(-0.6, 5, true)).toBe(4);
		expect(resolveIndexFromPosition(12.2, 5, true)).toBe(2);
	});

	test("clamps to the ends when not looping", () => {
		expect(resolveIndexFromPosition(4.6, 5, false)).toBe(4);
		expect(resolveIndexFromPosition(-0.6, 5, false)).toBe(0);
		expect(resolveIndexFromPosition(2.4, 5, false)).toBe(2);
	});

	test("never returns negative zero", () => {
		expect(Object.is(resolveIndexFromPosition(-0.4, 5, true), 0)).toBe(true);
		expect(Object.is(resolveIndexFromPosition(-0.4, 5, false), 0)).toBe(true);
	});

	test("is 0 with nothing to index", () => {
		expect(resolveIndexFromPosition(3, 0, true)).toBe(0);
		expect(resolveIndexFromPosition(3, 0, false)).toBe(0);
	});
});

describe("resolveNearestPosition", () => {
	test("is the index itself when that is nearest", () => {
		expect(resolveNearestPosition(2, 2, 5)).toBe(2);
		expect(resolveNearestPosition(1.4, 3, 5)).toBe(3);
	});

	test("goes forward past the end rather than all the way back", () => {
		expect(resolveNearestPosition(4, 0, 5)).toBe(5);
		expect(resolveNearestPosition(9, 0, 5)).toBe(10);
	});

	test("goes backward past the start rather than all the way forward", () => {
		expect(resolveNearestPosition(0.2, 4, 5)).toBe(-1);
		expect(resolveNearestPosition(0, 4, 5)).toBe(-1);
	});

	test("is the index with nothing to wrap", () => {
		expect(resolveNearestPosition(3, 0, 0)).toBe(0);
		expect(resolveNearestPosition(3, 0, 1)).toBe(0);
	});
});

describe("resolveRubberBand", () => {
	test("gives nothing for nothing", () => {
		expect(resolveRubberBand(0)).toBe(0);
	});

	test("an exponential approach to half a slide", () => {
		expect(resolveRubberBand(0.5)).toBeCloseTo(0.316, 3);
		expect(resolveRubberBand(1000)).toBeLessThanOrEqual(PAGING_RUBBER_BAND_MAX);
		expect(PAGING_RUBBER_BAND_MAX).toBe(0.5);
	});

	test("is monotonic and always gives less than it was asked", () => {
		let previous = 0;
		for (let x = 0.05; x < 5; x += 0.05) {
			const y = resolveRubberBand(x);
			expect(y).toBeGreaterThan(previous);
			expect(y).toBeLessThan(x);
			previous = y;
		}
	});

	test("is odd: a pull the other way mirrors it", () => {
		expect(resolveRubberBand(-0.5)).toBeCloseTo(-RUBBER_HALF);
	});
});

describe("resolvePanOrigin", () => {
	test("is the start resolvePanPosition maps back to where the slide already is", () => {
		const origin = resolvePanOrigin(1.9, -20, 200);
		expect(origin).toBeCloseTo(1.8);
		expect(resolvePanPosition({ count: 5, loop: false, pitch: 200, start: origin, translation: -20 })).toBeCloseTo(1.9);
	});

	test("an unmeasured viewport leaves the position alone", () => {
		expect(resolvePanOrigin(2, -20, 0)).toBe(2);
	});
});

describe("resolvePanPosition", () => {
	test("maps a drag against the pointer, in slides", () => {
		expect(resolvePanPosition({ count: 5, loop: true, pitch: 200, start: 2, translation: -100 })).toBe(2.5);
		expect(resolvePanPosition({ count: 5, loop: true, pitch: 200, start: 2, translation: 100 })).toBe(1.5);
	});

	test("rubber-bands past the first slide when not looping", () => {
		expect(resolvePanPosition({ count: 5, loop: false, pitch: 200, start: 0, translation: 100 })).toBeCloseTo(
			-RUBBER_HALF
		);
		expect(resolvePanPosition({ count: 5, loop: false, pitch: 200, start: 0, translation: 100 })).toBeCloseTo(
			-0.316,
			3
		);
	});

	test("rubber-bands past the last slide when not looping", () => {
		expect(resolvePanPosition({ count: 5, loop: false, pitch: 200, start: 4, translation: -100 })).toBeCloseTo(
			4 + RUBBER_HALF
		);
	});

	test("runs free past either end when looping", () => {
		expect(resolvePanPosition({ count: 5, loop: true, pitch: 200, start: 0, translation: 100 })).toBe(-0.5);
		expect(resolvePanPosition({ count: 5, loop: true, pitch: 200, start: 4, translation: -100 })).toBe(4.5);
	});

	test("an unmeasured viewport divides by nothing", () => {
		expect(resolvePanPosition({ count: 5, loop: false, pitch: 0, start: 2, translation: -100 })).toBe(2);
	});
});

describe("resolveSettleTarget", () => {
	const base = { count: 5, loop: false, pitch: 200, startIndex: 0 };

	test("a drag past the commit distance moves on", () => {
		expect(resolveSettleTarget({ ...base, position: 0.3, velocity: -100 })).toBe(1);
	});

	test("a short, slow drag springs back", () => {
		expect(resolveSettleTarget({ ...base, position: 0.1, velocity: -50 })).toBe(0);
	});

	test("a short flick moves on", () => {
		expect(resolveSettleTarget({ ...base, position: 0.1, velocity: -600 })).toBe(1);
	});

	test("a hard flick never moves more than one slide", () => {
		expect(resolveSettleTarget({ ...base, position: 0.5, velocity: -3000 })).toBe(1);
		expect(resolveSettleTarget({ ...base, position: 0.9, velocity: -3000 })).toBe(1);
		expect(resolveSettleTarget({ ...base, position: 1.4, velocity: -3000 })).toBe(1);
	});

	test("a flick back against the drag returns to where it started", () => {
		expect(resolveSettleTarget({ ...base, position: 0.4, velocity: 800 })).toBe(0);
		expect(resolveSettleTarget({ ...base, position: 2.4, startIndex: 2, velocity: 800 })).toBe(2);
	});

	test("a drag the other way goes back a slide", () => {
		expect(resolveSettleTarget({ ...base, position: 1.6, startIndex: 2, velocity: 100 })).toBe(1);
		expect(resolveSettleTarget({ ...base, position: 2, startIndex: 2, velocity: 900 })).toBe(1);
	});

	test("the thresholds are the documented ones", () => {
		expect(PAGING_COMMIT_VELOCITY).toBe(300);
		expect(PAGING_COMMIT_DISTANCE).toBe(0.25);
	});

	test("forward from the last slide is `count` when looping — the caller wraps it", () => {
		expect(resolveSettleTarget({ ...base, loop: true, position: 4.3, startIndex: 4, velocity: -100 })).toBe(5);
		expect(resolveSettleTarget({ ...base, loop: true, position: -0.3, startIndex: 0, velocity: 100 })).toBe(-1);
	});

	test("clamps to the ends when not looping", () => {
		expect(resolveSettleTarget({ ...base, position: 4.3, startIndex: 4, velocity: -900 })).toBe(4);
		expect(resolveSettleTarget({ ...base, position: -0.3, startIndex: 0, velocity: 900 })).toBe(0);
	});

	test("is 0 with nothing to settle on", () => {
		expect(resolveSettleTarget({ ...base, count: 0, position: 0.4, velocity: -900 })).toBe(0);
	});
});

describe("resolveVisibleRange", () => {
	test("wraps the window round the ring when looping", () => {
		expect(resolveVisibleRange(0, 10, true, 1)).toEqual([9, 0, 1]);
		expect(resolveVisibleRange(9, 10, true, 2)).toEqual([7, 8, 9, 0, 1]);
	});

	test("clips the window at the ends when not looping", () => {
		expect(resolveVisibleRange(0, 10, false, 1)).toEqual([0, 1]);
		expect(resolveVisibleRange(9, 10, false, 1)).toEqual([8, 9]);
	});

	test("is the window either side of the index", () => {
		expect(resolveVisibleRange(5, 10, false, 2)).toEqual([3, 4, 5, 6, 7]);
	});

	test("is everything when the window covers the whole run", () => {
		expect(resolveVisibleRange(1, 5, true, 2)).toEqual([0, 1, 2, 3, 4]);
		expect(resolveVisibleRange(0, 3, false, 2)).toEqual([0, 1, 2]);
	});

	test("is nothing with nothing to show", () => {
		expect(resolveVisibleRange(0, 0, true, 2)).toEqual([]);
	});
});
