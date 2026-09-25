import { describe, expect, test } from "bun:test";
import { contentArea } from "./content-area";

describe("contentArea", () => {
	test("the body gets what the handle, footer and keyboard leave", () => {
		expect(
			contentArea({ sheetHeight: 600, handleHeight: 24, footerHeight: 90, keyboardHeight: 0, trailingBand: 0 })
		).toBe(486);
	});

	test("without a footer the safe-area band trails the content instead", () => {
		expect(
			contentArea({ sheetHeight: 600, handleHeight: 24, footerHeight: 0, keyboardHeight: 0, trailingBand: 34 })
		).toBe(542);
	});

	test("a keyboard the sheet owns takes its height off the body", () => {
		expect(
			contentArea({ sheetHeight: 800, handleHeight: 24, footerHeight: 90, keyboardHeight: 336, trailingBand: 0 })
		).toBe(350);
	});

	test("never negative — a keyboard taller than the sheet leaves an empty body, not an inverted one", () => {
		expect(
			contentArea({ sheetHeight: 200, handleHeight: 24, footerHeight: 90, keyboardHeight: 336, trailingBand: 0 })
		).toBe(0);
	});

	test("unmeasured parts subtract nothing", () => {
		expect(
			contentArea({ sheetHeight: 600, handleHeight: -1, footerHeight: -1, keyboardHeight: 0, trailingBand: 0 })
		).toBe(600);
	});
});
