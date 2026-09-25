import { describe, expect, test } from "bun:test";
import { resolveSheetBottomInset, resolveSheetScrollEndPadding } from "./sheet-insets";

describe("resolveSheetBottomInset", () => {
	test("without a sticky footer the content's trailing spacer holds the safe-area band", () => {
		expect(resolveSheetBottomInset({ bottom: 34, hasStickyFooter: false })).toBe(34);
	});

	test("with a sticky footer the footer holds the band, so the content reserves none", () => {
		expect(resolveSheetBottomInset({ bottom: 34, hasStickyFooter: true })).toBe(0);
	});

	test("no inset, no band either way", () => {
		expect(resolveSheetBottomInset({ bottom: 0, hasStickyFooter: false })).toBe(0);
	});
});

describe("resolveSheetScrollEndPadding", () => {
	test("without a sticky footer a skin adds nothing — the engine's spacer already ends the content at the band", () => {
		expect(resolveSheetScrollEndPadding({ bottom: 34, hasStickyFooter: false, footerGap: 16 })).toBe(0);
	});

	test("with a sticky footer the scroll content ends a gap above the footer's hairline", () => {
		expect(resolveSheetScrollEndPadding({ bottom: 34, hasStickyFooter: true, footerGap: 16 })).toBe(16);
		expect(resolveSheetScrollEndPadding({ bottom: 0, hasStickyFooter: true, footerGap: 16 })).toBe(16);
	});
});
