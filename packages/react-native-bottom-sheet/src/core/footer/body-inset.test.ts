import { describe, expect, test } from "bun:test";
import { bodyClip, bodyInset, scrollContentHeight } from "./body-inset";

describe("bodyInset", () => {
	test("with a sticky footer the body reserves the footer, band included", () => {
		expect(bodyInset(true, 90, 34)).toBe(90);
	});

	test("without one it reserves the band alone", () => {
		expect(bodyInset(false, 0, 34)).toBe(34);
	});

	test("the band is gone under the keyboard, and so is the reservation", () => {
		expect(bodyInset(false, 0, 0)).toBe(0);
	});

	test("never negative — an unmeasured footer reserves nothing", () => {
		expect(bodyInset(true, -1, 34)).toBe(0);
		expect(bodyInset(false, 0, -1)).toBe(0);
	});
});

describe("bodyClip", () => {
	const at = (sheetHeight: number) =>
		bodyClip({ contentArea: 486, inset: 90, hasFooter: true, sheetHeight, handleHeight: 24, keyboardHeight: 0 });

	test("at rest on its snap point the body is clipped exactly at the footer's top edge", () => {
		// contentArea 486 = 600 − 24 − 90; the body is laid out 90 deeper, to the
		// sheet's bottom line, and the clip hides that 90 behind the footer.
		expect(at(600)).toBe(486);
	});

	test("dragged below its snap point the clip follows the live height, so nothing shows under the footer", () => {
		expect(at(500)).toBe(386);
		expect(at(200)).toBe(86);
	});

	test("above its snap point — an over-drag — the clip stays at the laid-out body", () => {
		expect(at(700)).toBe(486 + 90);
	});

	test("nearly closed, the footer sits at the top of the panel and the body is fully hidden", () => {
		expect(at(100)).toBe(0);
		expect(at(0)).toBe(0);
	});

	test("under the keyboard the footer's top edge is the keyboard's less the footer, and the clip follows", () => {
		expect(
			bodyClip({
				contentArea: 150,
				inset: 90,
				hasFooter: true,
				sheetHeight: 600,
				handleHeight: 24,
				keyboardHeight: 336,
			})
		).toBe(150);
		expect(
			bodyClip({
				contentArea: 150,
				inset: 90,
				hasFooter: true,
				sheetHeight: 550,
				handleHeight: 24,
				keyboardHeight: 336,
			})
		).toBe(100);
	});

	test("without a footer the body is never clipped short of its layout: it slides with the sheet", () => {
		expect(
			bodyClip({ contentArea: 542, inset: 34, hasFooter: false, sheetHeight: 300, handleHeight: 24, keyboardHeight: 0 })
		).toBe(576);
	});

	test("unmeasured parts count as zero", () => {
		expect(
			bodyClip({ contentArea: -1, inset: -1, hasFooter: true, sheetHeight: 600, handleHeight: -1, keyboardHeight: 0 })
		).toBe(0);
	});
});

describe("scrollContentHeight", () => {
	test("the rows are the content size less the trailing spacer", () => {
		expect(scrollContentHeight(1234, 90)).toBe(1144);
	});

	test("an unmeasured spacer subtracts nothing", () => {
		expect(scrollContentHeight(1234, -1)).toBe(1234);
	});

	test("never negative", () => {
		expect(scrollContentHeight(30, 90)).toBe(0);
	});
});
