/**
 * An integer from 0 to 99 as English words — `20` is `"twenty"`, `21` is
 * `"twenty-one"`.
 *
 * Exists so the components index can say *Twenty components* without anyone
 * typing the word: prose counts a number and spells it, and a spelled number
 * hand-written next to a list is wrong the moment the list grows. Lowercase;
 * a sentence opening capitalises it itself.
 *
 * Stops at 99 on purpose. The library has one count to spell, and it is a long
 * way from a hundred; a helper that handled thousands would be untested weight.
 */
export function numberToWords(n: number): string {
	if (!Number.isInteger(n) || n < 0 || n > 99) {
		throw new RangeError(`numberToWords: expected an integer from 0 to 99, got ${n}`);
	}
	const under = UNDER_TWENTY[n];
	if (under !== undefined) return under;
	const tens = TENS[Math.floor(n / 10)];
	if (tens === undefined) throw new RangeError(`numberToWords: no tens word for ${n}`);
	const ones = n % 10;
	return ones === 0 ? tens : `${tens}-${UNDER_TWENTY[ones]}`;
}

/** `numberToWords`, capitalised for the start of a sentence. */
export function numberToWordsCapitalised(n: number): string {
	const words = numberToWords(n);
	return words.charAt(0).toUpperCase() + words.slice(1);
}

const UNDER_TWENTY: readonly string[] = [
	"zero",
	"one",
	"two",
	"three",
	"four",
	"five",
	"six",
	"seven",
	"eight",
	"nine",
	"ten",
	"eleven",
	"twelve",
	"thirteen",
	"fourteen",
	"fifteen",
	"sixteen",
	"seventeen",
	"eighteen",
	"nineteen",
];

const TENS: readonly string[] = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
