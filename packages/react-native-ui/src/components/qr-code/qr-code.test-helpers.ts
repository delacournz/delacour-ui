import {
	QR_ERROR_CORRECTIONS,
	QR_MASKS,
	type QrErrorCorrection,
	type QrMask,
	type QrMatrix,
} from "./qr-code.constants";
import { formatWord } from "./qr-code.format";
import { gfExp, gfMultiply } from "./qr-code.gf";
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

/** Reads a symbol back from its modules alone. */
export function readQr(modules: Uint8Array, size: number): QrRead {
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

	const syndromesClean = blocksData.every((data, block) =>
		syndromesAreZero([...data, ...(blocksEc[block] ?? [])], layout.ecPerBlock)
	);
	return {
		errorCorrection: format.level,
		mask: format.mask,
		syndromesClean,
		value: decodeData(blocksData.flat(), version),
	};
}
