/**
 * An integer from 0 to 999 as English words — `21` is `"twenty-one"`, `108` is
 * `"one hundred and eight"`.
 *
 * Exists so the components index can say *Twenty components* without anyone
 * typing the word: prose counts a number and spells it, and a spelled number
 * hand-written next to a list is wrong the moment the list grows. Lowercase;
 * a sentence opening capitalises it itself. Hundreds take "and", as written in
 * New Zealand English.
 *
 * Stops at 999. The library's one count passed a hundred; a thousand is a long
 * way off, and a helper for it would be untested weight.
 */
export function numberToWords(n: number): string {
	if (!Number.isInteger(n) || n < 0 || n > 999) {
		throw new RangeError(`numberToWords: expected an integer from 0 to 999, got ${n}`);
	}
	if (n < 100) return underHundred(n);
	const hundreds = `${UNDER_TWENTY[Math.floor(n / 100)]} hundred`;
	const rest = n % 100;
	return rest === 0 ? hundreds : `${hundreds} and ${underHundred(rest)}`;
}

function underHundred(n: number): string {
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
