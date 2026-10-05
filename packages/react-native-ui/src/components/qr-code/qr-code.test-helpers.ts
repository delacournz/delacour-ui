import {
	QR_ERROR_CORRECTIONS,
	QR_MASKS,
	type QrErrorCorrection,
	type QrMask,
	type QrMatrix,
} from "./qr-code.constants";
import { formatWord } from "./qr-code.format";
import { gfExp, gfLog, gfMultiply } from "./qr-code.gf";
import { maskPredicate } from "./qr-code.mask";
import { buildFunctionMap } from "./qr-code.matrix";
import { blockLayout, QR_ALPHANUMERIC_CHARSET, totalCodewords } from "./qr-code.tables";

/**
 * **Test-only.** A reverse reader: it reads the format word off the matrix,
 * unmasks, walks the zigzag back into codewords, de-interleaves the blocks,
 * checks every block's Reed–Solomon syndromes and decodes the data segment.
 * Not exported from the folder's index and excluded from the registry.
 */

export type QrRead = {
	errorCorrection: QrErrorCorrection | null;
	mask: QrMask | null;
	/** Every block evaluates to zero at each root of its generator. */
	syndromesClean: boolean;
	value: string | null;
};

/** `#` for dark, `.` for light — the golden fixtures' shape. */
export function matrixToRows(matrix: Pick<QrMatrix, "modules" | "size">): string[] {
	const rows: string[] = [];
	for (let row = 0; row < matrix.size; row++) {
		let line = "";
		for (let col = 0; col < matrix.size; col++) line += matrix.modules[row * matrix.size + col] ? "#" : ".";
		rows.push(line);
	}
	return rows;
}

function readFormat(modules: Uint8Array, size: number): { level: QrErrorCorrection; mask: QrMask } | null {
	const at = (row: number, col: number): number => modules[row * size + col] ?? 0;
	const bits: number[] = [];
	for (let index = 0; index <= 5; index++) bits.push(at(index, 8));
	bits.push(at(7, 8), at(8, 8), at(8, 7));
	for (let index = 9; index < 15; index++) bits.push(at(8, 14 - index));
	const word = bits.reduce((sum, bit, index) => sum | (bit << index), 0);
	for (const level of QR_ERROR_CORRECTIONS) {
		for (const mask of QR_MASKS) {
			if (formatWord(level, mask) === word) return { level, mask };
		}
	}
	return null;
}

function readCodewords(
	modules: Uint8Array,
	isFunction: Uint8Array,
	size: number,
	mask: QrMask,
	count: number
): number[] {
	const bits: number[] = [];
	let column = size - 1;
	let upward = true;
	while (column > 0) {
		if (column === 6) column--;
		for (let step = 0; step < size; step++) {
			const row = upward ? size - 1 - step : step;
			for (const col of [column, column - 1]) {
				const index = row * size + col;
				if (isFunction[index]) continue;
				bits.push((modules[index] ?? 0) ^ (maskPredicate(mask, row, col) ? 1 : 0));
			}
		}
		upward = !upward;
		column -= 2;
	}
	const codewords: number[] = [];
	for (let index = 0; index + 8 <= bits.length && codewords.length < count; index += 8) {
		let byte = 0;
		for (let offset = 0; offset < 8; offset++) byte = (byte << 1) | (bits[index + offset] ?? 0);
		codewords.push(byte);
	}
	return codewords;
}

function syndromesOf(block: readonly number[], ecLength: number): number[] {
	const syndromes: number[] = [];
	for (let root = 0; root < ecLength; root++) {
		const x = gfExp(root);
		let value = 0;
		for (const coefficient of block) value = gfMultiply(value, x) ^ coefficient;
		syndromes.push(value);
	}
	return syndromes;
}

function gfInverse(value: number): number {
	return gfExp(255 - gfLog(value));
}

/** Evaluates a low-order-first polynomial at `x`. */
function evaluateLow(poly: readonly number[], x: number): number {
	let value = 0;
	for (let index = poly.length - 1; index >= 0; index--) value = gfMultiply(value, x) ^ (poly[index] ?? 0);
	return value;
}

/**
 * Corrects a block in place — Berlekamp–Massey for the locator, Chien search
 * for the positions, Forney for the magnitudes (first consecutive root 0).
 * Returns false when the block has more errors than it can correct.
 */
function correctBlock(block: number[], ecLength: number): boolean {
	const syndromes = syndromesOf(block, ecLength);
	if (syndromes.every((value) => value === 0)) return true;

	let locator = [1];
	let previous = [1];
	let length = 0;
	let shift = 1;
	let lastDiscrepancy = 1;
	for (let step = 0; step < ecLength; step++) {
		let discrepancy = syndromes[step] ?? 0;
		for (let index = 1; index <= length; index++) {
			discrepancy ^= gfMultiply(locator[index] ?? 0, syndromes[step - index] ?? 0);
		}
		if (discrepancy === 0) {
			shift++;
			continue;
		}
		const scale = gfMultiply(discrepancy, gfInverse(lastDiscrepancy));
		const next = locator.slice();
		for (let index = 0; index < previous.length; index++) {
			next[index + shift] = (next[index + shift] ?? 0) ^ gfMultiply(scale, previous[index] ?? 0);
		}
		if (2 * length <= step) {
			previous = locator;
			length = step + 1 - length;
			lastDiscrepancy = discrepancy;
			shift = 1;
		} else {
			shift++;
		}
		locator = next;
	}
	if (2 * length > ecLength) return false;

	const evaluator: number[] = new Array<number>(ecLength).fill(0);
	for (let i = 0; i < ecLength; i++) {
		for (let j = 0; j <= i && j < locator.length; j++) {
			evaluator[i] = (evaluator[i] ?? 0) ^ gfMultiply(syndromes[i - j] ?? 0, locator[j] ?? 0);
		}
	}
	const derivative = locator.map((coefficient, index) => (index % 2 === 1 ? coefficient : 0)).slice(1);

	let found = 0;
	for (let degree = 0; degree < block.length; degree++) {
		const inverse = gfInverse(gfExp(degree));
		if (evaluateLow(locator, inverse) !== 0) continue;
		const magnitude = gfMultiply(
			gfMultiply(gfExp(degree), evaluateLow(evaluator, inverse)),
			gfInverse(evaluateLow(derivative, inverse))
		);
		const position = block.length - 1 - degree;
		block[position] = (block[position] ?? 0) ^ magnitude;
		found++;
	}
	return found === length && syndromesOf(block, ecLength).every((value) => value === 0);
}

function syndromesAreZero(block: readonly number[], ecLength: number): boolean {
	for (let root = 0; root < ecLength; root++) {
		const x = gfExp(root);
		let value = 0;
		for (const coefficient of block) value = gfMultiply(value, x) ^ coefficient;
		if (value !== 0) return false;
	}
	return true;
}

class BitReader {
	private position = 0;
	constructor(private readonly bytes: readonly number[]) {}
	read(length: number): number {
		let value = 0;
		for (let index = 0; index < length; index++) {
			const byte = this.bytes[(this.position + index) >>> 3] ?? 0;
			value = (value << 1) | ((byte >>> (7 - ((this.position + index) & 7))) & 1);
		}
		this.position += length;
		return value;
	}
}

function decodeData(data: readonly number[], version: number): string | null {
	const reader = new BitReader(data);
	const mode = reader.read(4);
	const band = version <= 9 ? 0 : version <= 26 ? 1 : 2;
	if (mode === 0b0001) {
		const count = reader.read([10, 12, 14][band] ?? 0);
		let out = "";
		for (let left = count; left > 0; left -= 3) {
			const digits = Math.min(3, left);
			out += String(reader.read(digits * 3 + 1)).padStart(digits, "0");
		}
		return out;
	}
	if (mode === 0b0010) {
		const count = reader.read([9, 11, 13][band] ?? 0);
		let out = "";
		for (let left = count; left > 0; left -= 2) {
			if (left >= 2) {
				const pair = reader.read(11);
				out += QR_ALPHANUMERIC_CHARSET.charAt(Math.floor(pair / 45)) + QR_ALPHANUMERIC_CHARSET.charAt(pair % 45);
			} else {
				out += QR_ALPHANUMERIC_CHARSET.charAt(reader.read(6));
			}
		}
		return out;
	}
	if (mode === 0b0100) {
		const count = reader.read(version <= 9 ? 8 : 16);
		const bytes = new Uint8Array(count);
		for (let index = 0; index < count; index++) bytes[index] = reader.read(8);
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	}
	return null;
}

export type QrReadOptions = {
	/** Run Reed–Solomon correction on each block before decoding — for tests that damage the symbol. */
	correct?: boolean;
};

/** Reads a symbol back from its modules alone. */
export function readQr(modules: Uint8Array, size: number, options: QrReadOptions = {}): QrRead {
	const format = readFormat(modules, size);
	if (!format) return { errorCorrection: null, mask: null, syndromesClean: false, value: null };

	const version = (size - 17) / 4;
	const { isFunction } = buildFunctionMap(version);
	const codewords = readCodewords(modules, isFunction, size, format.mask, totalCodewords(version));
	const layout = blockLayout(version, format.level);

	const lengths = Array.from({ length: layout.blocks }, (_, block) =>
		block < layout.short.count ? layout.short.data : layout.long.data
	);
	const blocksData: number[][] = lengths.map(() => []);
	const blocksEc: number[][] = lengths.map(() => []);
	let cursor = 0;
	for (let column = 0; column < layout.long.data || column < layout.short.data; column++) {
		lengths.forEach((length, block) => {
			if (column < length) blocksData[block]?.push(codewords[cursor++] ?? 0);
		});
	}
	for (let column = 0; column < layout.ecPerBlock; column++) {
		for (const block of blocksEc) block.push(codewords[cursor++] ?? 0);
	}

	let corrected = true;
	if (options.correct) {
		blocksData.forEach((data, block) => {
			const whole = [...data, ...(blocksEc[block] ?? [])];
			if (!correctBlock(whole, layout.ecPerBlock)) corrected = false;
			data.splice(0, data.length, ...whole.slice(0, data.length));
			blocksEc[block] = whole.slice(data.length);
		});
	}

	const syndromesClean =
		corrected &&
		blocksData.every((data, block) => syndromesAreZero([...data, ...(blocksEc[block] ?? [])], layout.ecPerBlock));
	return {
		errorCorrection: format.level,
		mask: format.mask,
		syndromesClean,
		value: decodeData(blocksData.flat(), version),
	};
}
