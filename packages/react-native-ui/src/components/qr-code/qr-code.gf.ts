/**
 * GF(256) over the QR polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11D), and the
 * Reed–Solomon arithmetic the error-correction codewords are built from.
 */

const PRIMITIVE = 0x11d;

const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);

{
	let value = 1;
	for (let exponent = 0; exponent < 255; exponent++) {
		EXP[exponent] = value;
		LOG[value] = exponent;
		value <<= 1;
		if (value & 0x100) value ^= PRIMITIVE;
	}
	EXP[255] = 1;
}

/** alpha^i, for any non-negative `i` (the group has order 255). */
export function gfExp(exponent: number): number {
	return EXP[exponent % 255] ?? 0;
}

/** The exponent of a non-zero element. `gfLog(0)` is undefined in the field and returns 0. */
export function gfLog(value: number): number {
	return LOG[value] ?? 0;
}

export function gfMultiply(a: number, b: number): number {
	if (a === 0 || b === 0) return 0;
	return EXP[(gfLog(a) + gfLog(b)) % 255] ?? 0;
}

const GENERATORS = new Map<number, readonly number[]>();

/**
 * The monic generator (x - alpha^0)(x - alpha^1)…(x - alpha^(degree-1)),
 * coefficients highest power first. Memoised — a version-40 code asks for the
 * same one per block.
 */
export function rsGeneratorPolynomial(degree: number): readonly number[] {
	const cached = GENERATORS.get(degree);
	if (cached) return cached;

	let result: number[] = [1];
	for (let root = 0; root < degree; root++) {
		const next = new Array<number>(result.length + 1).fill(0);
		const factor = gfExp(root);
		result.forEach((coefficient, index) => {
			next[index] = (next[index] ?? 0) ^ coefficient;
			next[index + 1] = (next[index + 1] ?? 0) ^ gfMultiply(coefficient, factor);
		});
		result = next;
	}

	GENERATORS.set(degree, result);
	return result;
}

/** The `degree` error-correction codewords for one block of data — its remainder modulo the generator. */
export function rsRemainder(data: readonly number[], degree: number): number[] {
	const generator = rsGeneratorPolynomial(degree);
	const remainder = new Array<number>(degree).fill(0);

	for (const byte of data) {
		const factor = byte ^ (remainder.shift() ?? 0);
		remainder.push(0);
		for (let index = 0; index < degree; index++) {
			remainder[index] = (remainder[index] ?? 0) ^ gfMultiply(generator[index + 1] ?? 0, factor);
		}
	}

	return remainder;
}
