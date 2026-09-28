import { describe, expect, test } from "bun:test";
import { isInputInsideSheet } from "./keyboard-owner";

const sheet = { sheetTop: 400, containerBottom: 800 };

describe("isInputInsideSheet", () => {
	test("an input wholly within the sheet's frame is the sheet's", () => {
		expect(isInputInsideSheet({ ...sheet, inputY: 500, inputHeight: 44 })).toBe(true);
	});

	test("an input above the sheet belongs to the screen behind it", () => {
		expect(isInputInsideSheet({ ...sheet, inputY: 100, inputHeight: 44 })).toBe(false);
	});

	test("an input ending exactly at the sheet's top edge is not inside", () => {
		expect(isInputInsideSheet({ ...sheet, inputY: 356, inputHeight: 44 })).toBe(false);
	});

	test("an input straddling the sheet's top edge counts — it was scrolled half out, not moved out", () => {
		expect(isInputInsideSheet({ ...sheet, inputY: 380, inputHeight: 44 })).toBe(true);
	});

	test("an input below the container is not inside", () => {
		expect(isInputInsideSheet({ ...sheet, inputY: 900, inputHeight: 44 })).toBe(false);
	});

	test("a zero-height or unmeasured input never claims a keyboard", () => {
		expect(isInputInsideSheet({ ...sheet, inputY: 500, inputHeight: 0 })).toBe(false);
		expect(isInputInsideSheet({ ...sheet, inputY: -1, inputHeight: -1 })).toBe(false);
	});

	test("before the sheet has measured nothing is inside it", () => {
		expect(isInputInsideSheet({ sheetTop: -1, containerBottom: -1, inputY: 500, inputHeight: 44 })).toBe(false);
	});
});
