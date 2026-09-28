import { describe, expect, test } from "bun:test";
import { SHEET_STATE } from "../sheet.types";
import { sheetState } from "./sheet-state";

const detents = [200, 400];
const maxHeight = 800;

describe("sheetState", () => {
	test("at or below the closed height the sheet is closed", () => {
		expect(sheetState(0, 0, detents, 0, maxHeight)).toBe(SHEET_STATE.CLOSED);
		expect(sheetState(-10, -10, detents, 0, maxHeight)).toBe(SHEET_STATE.CLOSED);
		expect(sheetState(-32, -32, detents, -32, maxHeight)).toBe(SHEET_STATE.CLOSED);
	});

	test("between closed and the highest detent it is opened", () => {
		expect(sheetState(200, 200, detents, 0, maxHeight)).toBe(SHEET_STATE.OPENED);
		expect(sheetState(300, 300, detents, 0, maxHeight)).toBe(SHEET_STATE.OPENED);
	});

	test("at the highest detent it is extended", () => {
		expect(sheetState(400, 400, detents, 0, maxHeight)).toBe(SHEET_STATE.EXTENDED);
	});

	test("a hair below the highest detent still counts as extended, so a settled spring unlocks the list", () => {
		expect(sheetState(399.7, 399.7, detents, 0, maxHeight)).toBe(SHEET_STATE.EXTENDED);
	});

	test("above the highest detent — over-drag or a keyboard lift — it is over-extended", () => {
		expect(sheetState(450, 450, detents, 0, maxHeight)).toBe(SHEET_STATE.OVER_EXTENDED);
		expect(sheetState(400, 600, detents, 0, maxHeight)).toBe(SHEET_STATE.OVER_EXTENDED);
	});

	test("filling the available height is fill, whatever the detents say", () => {
		expect(sheetState(800, 800, detents, 0, maxHeight)).toBe(SHEET_STATE.FILL);
		expect(sheetState(400, 800, detents, 0, maxHeight)).toBe(SHEET_STATE.FILL);
		expect(sheetState(800, 800, [200, 800], 0, maxHeight)).toBe(SHEET_STATE.FILL);
	});

	test("with no detents anything open is extended, so a dynamic sheet still unlocks its list", () => {
		expect(sheetState(300, 300, [], 0, maxHeight)).toBe(SHEET_STATE.EXTENDED);
	});
});
