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
		[100, "one hundred"],
		[101, "one hundred and one"],
		[108, "one hundred and eight"],
		[120, "one hundred and twenty"],
		[142, "one hundred and forty-two"],
		[300, "three hundred"],
		[999, "nine hundred and ninety-nine"],
	])("%i is %s", (n, words) => {
		expect(numberToWords(n)).toBe(words);
	});

	test("covers every integer from 0 to 99 with a single lowercase word or hyphenated pair", () => {
		const all = Array.from({ length: 100 }, (_, n) => numberToWords(n));
		expect(new Set(all).size).toBe(100);
		for (const words of all) expect(words).toMatch(/^[a-z]+(-[a-z]+)?$/);
	});

	test("covers every integer from 0 to 999 with distinct words", () => {
		const all = Array.from({ length: 1000 }, (_, n) => numberToWords(n));
		expect(new Set(all).size).toBe(1000);
		for (const words of all.slice(100)) expect(words).toMatch(/^[a-z]+ hundred( and [a-z]+(-[a-z]+)?)?$/);
	});

	test.each([1000, -1, 1.5, Number.NaN])("throws for %p", (n) => {
		expect(() => numberToWords(n)).toThrow();
	});
});

describe("numberToWordsCapitalised", () => {
	test.each([
		[20, "Twenty"],
		[21, "Twenty-one"],
		[7, "Seven"],
		[108, "One hundred and eight"],
	])("%i is %s", (n, words) => {
		expect(numberToWordsCapitalised(n)).toBe(words);
	});
});
