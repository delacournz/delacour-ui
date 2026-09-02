import { describe, expect, test } from "bun:test";
import { categoricalTickFormat, defaultTickFormat, formatDateTick, formatNumberTick } from "./format-tick";

const DAY = 86_400_000;
const YEAR = 365 * DAY;

describe("formatNumberTick", () => {
	test("prints an integer plainly", () => {
		expect(formatNumberTick(0)).toBe("0");
		expect(formatNumberTick(-1200)).toBe("-1200");
	});

	test("strips floating-point noise", () => {
		// What a tick generator dividing a domain actually produces.
		expect(formatNumberTick(0.1 + 0.2)).toBe("0.3");
		expect(formatNumberTick(1 / 3)).toBe("0.333333333333");
	});

	test("returns an empty label rather than the word NaN", () => {
		expect(formatNumberTick(Number.NaN)).toBe("");
		expect(formatNumberTick(Number.POSITIVE_INFINITY)).toBe("");
	});
});

describe("formatDateTick", () => {
	const noon = new Date(2026, 5, 17, 14, 5).getTime();

	test("uses clock time inside a day", () => {
		expect(formatDateTick(noon, 6 * 3_600_000)).toBe("14:05");
	});

	test("uses day and month inside a year", () => {
		expect(formatDateTick(noon, 30 * DAY)).toBe("17 Jun");
	});

	test("uses month and two-digit year over a few years", () => {
		expect(formatDateTick(noon, 2 * YEAR)).toBe("Jun 26");
	});

	test("uses the year alone over a long span", () => {
		expect(formatDateTick(noon, 20 * YEAR)).toBe("2026");
	});

	test("pads the clock so labels stay the same width", () => {
		// Ragged widths make an axis look broken and shift the measured gutter.
		expect(formatDateTick(new Date(2026, 0, 1, 9, 5).getTime(), 3_600_000)).toBe("09:05");
	});

	test("returns an empty label for a non-finite value", () => {
		expect(formatDateTick(Number.NaN, DAY)).toBe("");
	});
});

describe("defaultTickFormat", () => {
	test("gives a time scale the date formatter and everything else the number one", () => {
		expect(defaultTickFormat("time", 30 * DAY)(new Date(2026, 5, 17).getTime())).toBe("17 Jun");
		expect(defaultTickFormat("linear", 0)(42)).toBe("42");
		expect(defaultTickFormat("log", 0)(1000)).toBe("1000");
	});
});

describe("categoricalTickFormat", () => {
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

	test("reads the label at the datum index the tick names", () => {
		// Six months downsampled to four ticks leaves values [0, 2, 3, 5].
		// Formatting by the tick's own ordinal would print Jan Feb Mar Apr
		// against bars standing at Jan, Mar, Apr and Jun.
		const format = categoricalTickFormat(months);
		expect([0, 2, 3, 5].map(format)).toEqual(["Jan", "Mar", "Apr", "Jun"]);
	});

	test("rounds a fractional value onto a datum", () => {
		expect(categoricalTickFormat(months)(2.4)).toBe("Mar");
	});

	test("returns an empty label outside the data rather than undefined", () => {
		const format = categoricalTickFormat(months);
		expect(format(-1)).toBe("");
		expect(format(99)).toBe("");
	});

	test("stringifies a non-string label", () => {
		expect(categoricalTickFormat([1, null])(0)).toBe("1");
		expect(categoricalTickFormat([1, null])(1)).toBe("");
	});
});
