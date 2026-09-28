import { describe, expect, test } from "bun:test";
import { dynamicDetent } from "./dynamic-detent";

const measured = { handleHeight: 24, contentHeight: 300, footerContentHeight: 56, band: 34, available: 800 };

describe("dynamicDetent", () => {
	test("without a footer the sheet is handle, content and the safe-area band", () => {
		expect(dynamicDetent({ ...measured, hasFooter: false })).toBe(24 + 300 + 34);
	});

	test("with a footer the footer content is included, and the band is counted once", () => {
		expect(dynamicDetent({ ...measured, hasFooter: true })).toBe(24 + 300 + 56 + 34);
	});

	test("a detached sheet has no band, so it contributes nothing", () => {
		expect(dynamicDetent({ ...measured, band: 0, hasFooter: true })).toBe(24 + 300 + 56);
	});

	test("never exceeds the available height", () => {
		expect(dynamicDetent({ ...measured, contentHeight: 2000, hasFooter: true })).toBe(800);
	});

	test("maxDynamicContentSize caps below the available height", () => {
		expect(dynamicDetent({ ...measured, contentHeight: 2000, hasFooter: false, maxDynamicContentSize: 500 })).toBe(500);
	});

	test("maxDynamicContentSize above the available height changes nothing", () => {
		expect(dynamicDetent({ ...measured, contentHeight: 2000, hasFooter: false, maxDynamicContentSize: 5000 })).toBe(
			800
		);
	});

	test("unmeasured parts count as zero rather than pulling the sum negative", () => {
		expect(dynamicDetent({ ...measured, handleHeight: -1, footerContentHeight: -1, hasFooter: true })).toBe(300 + 34);
	});

	test("an unmeasured container yields zero, never a negative height", () => {
		expect(dynamicDetent({ ...measured, available: -1, hasFooter: false })).toBe(0);
	});
});
