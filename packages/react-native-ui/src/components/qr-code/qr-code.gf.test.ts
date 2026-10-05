import { describe, expect, test } from "bun:test";
import { gfExp, gfLog, gfMultiply, rsGeneratorPolynomial, rsRemainder } from "./qr-code.gf";

/** Evaluates a highest-first polynomial at `x` over GF(256). */
function evaluate(coefficients: readonly number[], x: number): number {
	let result = 0;
	for (const coefficient of coefficients) result = gfMultiply(result, x) ^ coefficient;
	return result;
}

describe("gfExp / gfLog", () => {
	test("the antilog table walks powers of two reduced by 0x11D", () => {
		expect(gfExp(0)).toBe(1);
		expect(gfExp(1)).toBe(2);
		expect(gfExp(7)).toBe(128);
		expect(gfExp(8)).toBe(29);
		expect(gfExp(255)).toBe(1);
	});

	test("log is the inverse of exp across the multiplicative group", () => {
		expect(gfLog(2)).toBe(1);
		expect(gfLog(29)).toBe(8);
		for (let value = 1; value < 256; value++) expect(gfExp(gfLog(value))).toBe(value);
	});

	test("the group has order 255 — every non-zero element appears exactly once", () => {
		const seen = new Set<number>();
		for (let exponent = 0; exponent < 255; exponent++) seen.add(gfExp(exponent));
		expect(seen.size).toBe(255);
		expect(seen.has(0)).toBe(false);
	});
});

describe("gfMultiply", () => {
	test("pinned products", () => {
		expect(gfMultiply(2, 128)).toBe(29);
		expect(gfMultiply(3, 7)).toBe(9);
	});

	test("zero absorbs and one is the identity", () => {
		for (let value = 0; value < 256; value++) {
			expect(gfMultiply(0, value)).toBe(0);
			expect(gfMultiply(value, 0)).toBe(0);
			expect(gfMultiply(1, value)).toBe(value);
		}
	});

	test("commutes over the whole field", () => {
		for (let a = 0; a < 256; a++) {
			for (let b = a; b < 256; b++) {
				if (gfMultiply(a, b) !== gfMultiply(b, a)) throw new Error(`${a} * ${b} does not commute`);
			}
		}
	});
});

describe("rsGeneratorPolynomial", () => {
	test.each([
		[7, [0, 87, 229, 146, 149, 238, 102, 21]],
		[10, [0, 251, 67, 46, 61, 118, 70, 64, 94, 32, 45]],
		[13, [0, 74, 152, 176, 100, 86, 100, 106, 104, 130, 218, 206, 140, 78]],
	])("degree %i, as alpha exponents", (degree, exponents) => {
		expect(rsGeneratorPolynomial(degree).map(gfLog)).toEqual(exponents);
	});

	test("is monic, degree + 1 long, and has alpha^0..alpha^(d-1) as roots", () => {
		for (const degree of [7, 10, 16, 22, 30]) {
			const generator = rsGeneratorPolynomial(degree);
			expect(generator).toHaveLength(degree + 1);
			expect(generator[0]).toBe(1);
			for (let root = 0; root < degree; root++) expect(evaluate(generator, gfExp(root))).toBe(0);
		}
	});
});

describe("rsRemainder", () => {
	test("HELLO WORLD, 1-M", () => {
		const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
		expect(rsRemainder(data, 10)).toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
	});

	test("01234567, 1-M", () => {
		const data = [16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17];
		expect(rsRemainder(data, 10)).toEqual([165, 36, 212, 193, 237, 54, 199, 135, 44, 85]);
	});

	test("all-zero data has an all-zero remainder", () => {
		expect(rsRemainder(new Array(20).fill(0), 18)).toEqual(new Array(18).fill(0));
	});

	test("data followed by its remainder has zero syndromes", () => {
		const data = Array.from({ length: 40 }, (_, index) => (index * 37 + 11) % 256);
		const codeword = [...data, ...rsRemainder(data, 22)];
		for (let root = 0; root < 22; root++) expect(evaluate(codeword, gfExp(root))).toBe(0);
	});
});
