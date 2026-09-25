import { describe, expect, test } from "bun:test";
import { numberToWords, numberToWordsCapitalised } from "./number-words";

describe("numberToWords", () => {
	test.each([
		[0, "zero"],
		[1, "one"],
		[9, "nine"],
		[10, "ten"],
		[11, "eleven"],
		[13, "thirteen"],
		[19, "nineteen"],
		[20, "twenty"],
		[21, "twenty-one"],
		[30, "thirty"],
		[42, "forty-two"],
		[50, "fifty"],
		[68, "sixty-eight"],
		[77, "seventy-seven"],
		[80, "eighty"],
		[99, "ninety-nine"],
	])("%i is %s", (n, words) => {
		expect(numberToWords(n)).toBe(words);
	});

	test("covers every integer from 0 to 99 with a single lowercase word or hyphenated pair", () => {
		const all = Array.from({ length: 100 }, (_, n) => numberToWords(n));
		expect(new Set(all).size).toBe(100);
		for (const words of all) expect(words).toMatch(/^[a-z]+(-[a-z]+)?$/);
	});

	test.each([100, -1, 1.5, Number.NaN])("throws for %p", (n) => {
		expect(() => numberToWords(n)).toThrow();
	});
});

describe("numberToWordsCapitalised", () => {
	test.each([
		[20, "Twenty"],
		[21, "Twenty-one"],
		[7, "Seven"],
	])("%i is %s", (n, words) => {
		expect(numberToWordsCapitalised(n)).toBe(words);
	});
});
