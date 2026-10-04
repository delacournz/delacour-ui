import { describe, expect, test } from "bun:test";
import { SHEET_STATE } from "../sheet.types";
import { contentPanDrivesSheet, shouldLockScroll } from "./scroll-lock";

describe("shouldLockScroll", () => {
	test("locked below the highest snap point — a drag on the list moves the sheet, not the rows", () => {
		expect(shouldLockScroll(SHEET_STATE.CLOSED, true)).toBe(true);
		expect(shouldLockScroll(SHEET_STATE.OPENED, true)).toBe(true);
	});

	test("unlocked at the highest snap point and beyond", () => {
		expect(shouldLockScroll(SHEET_STATE.EXTENDED, true)).toBe(false);
		expect(shouldLockScroll(SHEET_STATE.OVER_EXTENDED, true)).toBe(false);
		expect(shouldLockScroll(SHEET_STATE.FILL, true)).toBe(false);
	});

	test("never locked when the content pan is off — the list is the only thing that can move", () => {
		expect(shouldLockScroll(SHEET_STATE.OPENED, false)).toBe(false);
	});
});

describe("contentPanDrivesSheet", () => {
	test("while locked the pan always drives the sheet", () => {
		expect(contentPanDrivesSheet({ locked: true, contentOffsetY: 120, translationY: -10 })).toBe(true);
	});

	test("unlocked and scrolled, the list owns the drag", () => {
		expect(contentPanDrivesSheet({ locked: false, contentOffsetY: 120, translationY: 10 })).toBe(false);
		expect(contentPanDrivesSheet({ locked: false, contentOffsetY: 120, translationY: -10 })).toBe(false);
	});

	test("unlocked at the top, a downward drag pulls the sheet and an upward one scrolls the list", () => {
		expect(contentPanDrivesSheet({ locked: false, contentOffsetY: 0, translationY: 10 })).toBe(true);
		expect(contentPanDrivesSheet({ locked: false, contentOffsetY: 0, translationY: -10 })).toBe(false);
	});

	test("a bounced-past-the-top offset counts as the top", () => {
		expect(contentPanDrivesSheet({ locked: false, contentOffsetY: -30, translationY: 10 })).toBe(true);
	});
});
