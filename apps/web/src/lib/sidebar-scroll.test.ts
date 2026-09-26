import { describe, expect, test } from "bun:test";
import { isWithin, parseScrollTop } from "./sidebar-scroll";

/**
 * The sidebar keeps its own scroll offset across navigations. A bad read has
 * to fall back to "restore nothing" rather than throw or jump somewhere odd.
 */
describe("parseScrollTop", () => {
	test("reads a stored offset", () => {
		expect(parseScrollTop("845")).toBe(845);
		expect(parseScrollTop("0")).toBe(0);
	});

	test("restores nothing when there is nothing usable", () => {
		expect(parseScrollTop(null)).toBeNull();
		expect(parseScrollTop("")).toBeNull();
		expect(parseScrollTop("abc")).toBeNull();
		expect(parseScrollTop("-20")).toBeNull();
		expect(parseScrollTop("Infinity")).toBeNull();
	});
});

/**
 * After restoring, the active item must still be on screen — a page reached
 * from search can sit far from where the sidebar was left.
 */
describe("isWithin", () => {
	const viewport = { top: 100, bottom: 900 };

	test("an item fully inside the viewport is visible", () => {
		expect(isWithin({ top: 200, bottom: 230 }, viewport)).toBe(true);
		expect(isWithin({ top: 100, bottom: 900 }, viewport)).toBe(true);
	});

	test("an item above, below or cut by an edge is not", () => {
		expect(isWithin({ top: 40, bottom: 70 }, viewport)).toBe(false);
		expect(isWithin({ top: 950, bottom: 980 }, viewport)).toBe(false);
		expect(isWithin({ top: 880, bottom: 910 }, viewport)).toBe(false);
	});
});
