import { describe, expect, test } from "bun:test";
import { SCROLLABLE_TYPE } from "../sheet.types";
import { listDragHeight, listOwnsRelease, restingDetent, scrollLockTarget } from "./scroll-pan";

describe("listDragHeight", () => {
	const highest = 600;

	test("at the top with the list scrolled, the finger spends the offset before the sheet moves", () => {
		const at = (translationY: number) =>
			listDragHeight({ startBase: 600, translationY, startOffset: 204, held: false, highest });
		expect(at(100)).toBe(600);
		expect(at(204)).toBe(600);
		expect(at(254)).toBe(550);
	});

	test("at the top with the list at its top, a pull-down moves the sheet at once", () => {
		expect(listDragHeight({ startBase: 600, translationY: 30, startOffset: 0, held: false, highest })).toBe(570);
	});

	test("an upward drag at the top never over-drags: the list scrolls and bounces instead", () => {
		expect(listDragHeight({ startBase: 600, translationY: -100, startOffset: 0, held: false, highest })).toBe(600);
		expect(listDragHeight({ startBase: 600, translationY: -100, startOffset: 204, held: false, highest })).toBe(600);
	});

	test("a list held by the lock has no budget: the drag moves the sheet whatever it holds", () => {
		expect(listDragHeight({ startBase: 300, translationY: -100, startOffset: 204, held: true, highest })).toBe(400);
		expect(listDragHeight({ startBase: 300, translationY: 50, startOffset: 204, held: true, highest })).toBe(250);
	});

	test("once a held list's sheet reaches the top the budget applies, and the clamp absorbs it", () => {
		expect(listDragHeight({ startBase: 300, translationY: -300, startOffset: 204, held: false, highest })).toBe(600);
		expect(listDragHeight({ startBase: 300, translationY: -96, startOffset: 204, held: false, highest })).toBe(600);
		expect(listDragHeight({ startBase: 300, translationY: -90, startOffset: 204, held: false, highest })).toBe(594);
	});

	test("a bounce past the top when the gesture began counts as no budget", () => {
		expect(listDragHeight({ startBase: 600, translationY: 30, startOffset: -20, held: false, highest })).toBe(570);
	});
});

describe("listOwnsRelease", () => {
	const highest = 600;

	test("a content pan released with the list scrolled and the sheet at the highest detent is the list's", () => {
		expect(listOwnsRelease({ scrollable: true, offset: 120, base: 600, highest })).toBe(true);
		expect(listOwnsRelease({ scrollable: true, offset: 120, base: 599.7, highest })).toBe(true);
	});

	test("at the top of the list the sheet takes it", () => {
		expect(listOwnsRelease({ scrollable: true, offset: 0, base: 600, highest })).toBe(false);
		expect(listOwnsRelease({ scrollable: true, offset: -12, base: 600, highest })).toBe(false);
	});

	test("below the highest detent the sheet takes it whatever the offset", () => {
		expect(listOwnsRelease({ scrollable: true, offset: 120, base: 300, highest })).toBe(false);
	});

	test("static content never hands a release to a list", () => {
		expect(listOwnsRelease({ scrollable: false, offset: 120, base: 600, highest })).toBe(false);
	});
});

describe("restingDetent", () => {
	const detents = [200, 400, 600];

	test("a base on a detent, or within the settle tolerance of one, is resting on it", () => {
		expect(restingDetent(600, detents)).toBe(600);
		expect(restingDetent(599.7, detents)).toBe(600);
		expect(restingDetent(400.4, detents)).toBe(400);
	});

	test("a base between detents rests on none", () => {
		expect(restingDetent(500, detents)).toBeNull();
		expect(restingDetent(598, detents)).toBeNull();
	});

	test("with no detents nothing can be rested on", () => {
		expect(restingDetent(0, [])).toBeNull();
	});
});

describe("scrollLockTarget", () => {
	test("a handle drag or a snap holds the list where it is, never above the top", () => {
		expect(scrollLockTarget(140, false)).toBe(140);
		expect(scrollLockTarget(0, false)).toBe(0);
		expect(scrollLockTarget(-40, false)).toBe(0);
	});

	test("a content pan leaves the top only once the list is at its top, so it locks at zero", () => {
		expect(scrollLockTarget(9, true)).toBe(0);
	});
});

describe("SCROLLABLE_TYPE", () => {
	test("static content is zero, so a fresh shared value means no scrollable", () => {
		expect(SCROLLABLE_TYPE.NONE).toBe(0);
		expect(new Set(Object.values(SCROLLABLE_TYPE)).size).toBe(4);
	});
});
