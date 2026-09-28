import { describe, expect, test } from "bun:test";
import { closedHeight } from "./closed-height";
import { DETACHED_DEFAULTS, detachedFrame, resolveDetached } from "./detached-frame";
import { positionFor } from "./position";

describe("resolveDetached", () => {
	test("undefined and false are attached", () => {
		expect(resolveDetached(undefined)).toBeNull();
		expect(resolveDetached(false)).toBeNull();
	});

	test("true takes the defaults", () => {
		expect(resolveDetached(true)).toEqual(DETACHED_DEFAULTS);
		expect(DETACHED_DEFAULTS).toEqual({ horizontalMargin: 16, bottomOffset: 16 });
	});

	test("an object fills in whichever default it leaves out", () => {
		expect(resolveDetached({ horizontalMargin: 24 })).toEqual({ horizontalMargin: 24, bottomOffset: 16 });
		expect(resolveDetached({ bottomOffset: 0 })).toEqual({ horizontalMargin: 16, bottomOffset: 0 });
	});
});

describe("detachedFrame", () => {
	test("the card is inset by the margin on both sides", () => {
		expect(detachedFrame({ containerWidth: 390, horizontalMargin: 16, bottomOffset: 16, bottomInset: 34 })).toEqual({
			left: 16,
			width: 358,
			restingBottom: 50,
		});
	});

	test("a margin wider than the container collapses the width to zero rather than going negative", () => {
		expect(detachedFrame({ containerWidth: 20, horizontalMargin: 16, bottomOffset: 16, bottomInset: 0 }).width).toBe(0);
	});

	test("an unmeasured width yields an empty frame", () => {
		expect(detachedFrame({ containerWidth: -1, horizontalMargin: 16, bottomOffset: 16, bottomInset: 0 }).width).toBe(0);
	});

	test("closed, a detached sheet's translateY is the full container height — entirely off-screen", () => {
		const frame = detachedFrame({ containerWidth: 390, horizontalMargin: 16, bottomOffset: 16, bottomInset: 34 });
		expect(positionFor(800, frame.restingBottom, closedHeight(frame.restingBottom))).toBe(800);
	});

	test("open, a detached sheet's bottom edge floats restingBottom above the container edge", () => {
		const frame = detachedFrame({ containerWidth: 390, horizontalMargin: 16, bottomOffset: 16, bottomInset: 34 });
		const top = positionFor(800, frame.restingBottom, 300);
		expect(800 - (top + 300)).toBe(50);
	});
});
