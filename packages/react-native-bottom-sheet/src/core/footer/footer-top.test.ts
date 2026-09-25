import { describe, expect, test } from "bun:test";
import { keyboardLift } from "../keyboard/keyboard-lift";
import { bandNow } from "./bottom-band";
import { footerTop } from "./footer-top";

describe("footerTop", () => {
	test("with no keyboard the footer sits above its band at the bottom of the sheet", () => {
		expect(footerTop({ sheetHeight: 500, keyboardHeight: 0, footerContentHeight: 56, band: 34 })).toBe(410);
	});

	test("a keyboard pushes the footer up by its full height", () => {
		expect(footerTop({ sheetHeight: 500, keyboardHeight: 300, footerContentHeight: 56, band: 0 })).toBe(144);
	});

	test("never negative — a footer taller than the sheet pins to the top", () => {
		expect(footerTop({ sheetHeight: 40, keyboardHeight: 0, footerContentHeight: 56, band: 34 })).toBe(0);
	});

	test("an unmeasured footer subtracts nothing", () => {
		expect(footerTop({ sheetHeight: 500, keyboardHeight: 0, footerContentHeight: -1, band: 34 })).toBe(466);
	});

	/**
	 * The proof the whole footer/keyboard/inset model rests on.
	 *
	 * The sheet's height is `base + keyboardLift`, the lift is
	 * `kb − band · p`, and the band under the footer is `band · (1 − p)`. Then
	 * `footerTop = base + kb − band·p − kb − footer − band + band·p`
	 *            = `base − footer − band`,
	 * independent of `p`: the footer does not move a pixel while the keyboard
	 * animates, only the safe-area band under it collapses, and at `p = 1` the
	 * footer's bottom edge sits on the keyboard's top edge.
	 */
	test("holds still for the whole keyboard animation", () => {
		const base = 24 + 300 + 56 + 34;
		const band = 34;
		const footerContentHeight = 56;
		const fullKeyboard = 336;
		const expected = base - footerContentHeight - band;

		for (let step = 0; step <= 20; step += 1) {
			const progress = step / 20;
			const keyboardHeight = fullKeyboard * progress;
			const lift = keyboardLift({ keyboardHeight, progress, band, behavior: "interactive", gapBelow: 0 });
			const sheetHeight = base + lift;
			const top = footerTop({ sheetHeight, keyboardHeight, footerContentHeight, band: bandNow(band, progress) });
			expect(top).toBeCloseTo(expected, 6);
		}
	});

	test("at full keyboard the footer's bottom edge sits on the keyboard's top edge", () => {
		const base = 414;
		const band = 34;
		const footerContentHeight = 56;
		const keyboardHeight = 336;
		const lift = keyboardLift({ keyboardHeight, progress: 1, band, behavior: "interactive", gapBelow: 0 });
		const sheetHeight = base + lift;
		const top = footerTop({ sheetHeight, keyboardHeight, footerContentHeight, band: bandNow(band, 1) });
		expect(top + footerContentHeight).toBe(sheetHeight - keyboardHeight);
	});
});
