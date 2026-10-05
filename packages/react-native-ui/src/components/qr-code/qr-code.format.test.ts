import { describe, expect, test } from "bun:test";
import { QR_ERROR_CORRECTIONS, QR_MASKS } from "./qr-code.constants";
import { formatWord, versionWord } from "./qr-code.format";

function hamming(a: number, b: number): number {
	let diff = a ^ b;
	let count = 0;
	while (diff) {
		count += diff & 1;
		diff >>>= 1;
	}
	return count;
}

describe("formatWord", () => {
	test.each([
		["M", 0, "101010000010010"],
		["M", 1, "101000100100101"],
		["M", 2, "101111001111100"],
		["M", 3, "101101101001011"],
		["M", 4, "100010111111001"],
		["M", 5, "100000011001110"],
		["M", 6, "100111110010111"],
		["M", 7, "100101010100000"],
		["L", 0, "111011111000100"],
		["Q", 0, "011010101011111"],
		["H", 0, "001011010001001"],
	] as const)("%s, mask %i", (level, mask, bits) => {
		expect(formatWord(level, mask).toString(2).padStart(15, "0")).toBe(bits);
	});

	test("all 32 words sit at least 8 bits apart", () => {
		const words = QR_ERROR_CORRECTIONS.flatMap((level) => QR_MASKS.map((mask) => formatWord(level, mask)));
		expect(new Set(words).size).toBe(32);
		for (let i = 0; i < words.length; i++) {
			for (let j = i + 1; j < words.length; j++) {
				expect(hamming(words[i] ?? 0, words[j] ?? 0)).toBeGreaterThanOrEqual(8);
			}
		}
	});
});

describe("versionWord", () => {
	test("versions below 7 carry none", () => {
		for (let version = 1; version <= 6; version++) expect(versionWord(version)).toBeNull();
	});

	test.each([
		[7, "000111110010010100"],
		[8, "001000010110111100"],
		[40, "101000110001101001"],
	])("version %i", (version, bits) => {
		expect(versionWord(version)?.toString(2).padStart(18, "0")).toBe(bits);
	});

	test("every word is a multiple of the generator and the set is 8 apart", () => {
		const words: number[] = [];
		for (let version = 7; version <= 40; version++) {
			const word = versionWord(version) ?? 0;
			expect(word >>> 12).toBe(version);
			let remainder = word;
			for (let bit = 17; bit >= 12; bit--) {
				if ((remainder >>> bit) & 1) remainder ^= 0x1f25 << (bit - 12);
			}
			expect(remainder).toBe(0);
			words.push(word);
		}
		for (let i = 0; i < words.length; i++) {
			for (let j = i + 1; j < words.length; j++) {
				expect(hamming(words[i] ?? 0, words[j] ?? 0)).toBeGreaterThanOrEqual(8);
			}
		}
	});
});
