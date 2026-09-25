import { describe, expect, test } from "bun:test";
import { resolveSheetBottomInset, resolveSheetScrollEndPadding } from "./sheet-insets";

describe("resolveSheetBottomInset", () => {
	test("without a sticky footer the content takes the safe-area band", () => {
		expect(resolveSheetBottomInset({ bottom: 34, hasStickyFooter: false })).toBe(34);
	});

	test("with a sticky footer the footer holds the band, so the content takes none", () => {
		expect(resolveSheetBottomInset({ bottom: 34, hasStickyFooter: true })).toBe(0);
	});

	test("no inset, no padding either way", () => {
		expect(resolveSheetBottomInset({ bottom: 0, hasStickyFooter: false })).toBe(0);
	});
});

describe("resolveSheetScrollEndPadding", () => {
	test("without a sticky footer the scroll content ends at the safe-area band", () => {
		expect(resolveSheetScrollEndPadding({ bottom: 34, hasStickyFooter: false, footerGap: 16 })).toBe(34);
	});

	test("with a sticky footer the scroll content ends a gap above the footer's hairline", () => {
		expect(resolveSheetScrollEndPadding({ bottom: 34, hasStickyFooter: true, footerGap: 16 })).toBe(16);
		expect(resolveSheetScrollEndPadding({ bottom: 0, hasStickyFooter: true, footerGap: 16 })).toBe(16);
	});
});
