import type { QrErrorCorrection, QrVersion } from "./qr-code.constants";

/**
 * The standard's capacity tables, and the closed forms they must agree with.
 *
 * Two 4 x 40 tables carry everything that cannot be derived: error-correction
 * codewords per block and the number of blocks, per level and version. Every
 * other count follows — total codewords from the module geometry, data
 * codewords by subtraction, the block split by division. `qr-code.tables.test.ts`
 * holds every pair against those closed forms, which is the net for a typo here.
 */

export const QR_MIN_VERSION = 1;
export const QR_MAX_VERSION = 40;

/** The 45 characters alphanumeric mode encodes, in code order. */
export const QR_ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

type LevelTable = Readonly<Record<QrErrorCorrection, readonly number[]>>;

/** Error-correction codewords per block. Index = version - 1. */
const EC_PER_BLOCK: LevelTable = {
	L: [
		7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30,
		30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
	],
	M: [
		10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28,
		28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
	],
	Q: [
		13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30,
		30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
	],
	H: [
		17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30,
		30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
	],
};

/** Error-correction blocks. Index = version - 1. */
const BLOCKS: LevelTable = {
	L: [
		1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19,
		20, 21, 22, 24, 25,
	],
	M: [
		1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33,
		35, 37, 38, 40, 43, 45, 47, 49,
	],
	Q: [
		1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45,
		48, 51, 53, 56, 59, 62, 65, 68,
	],
	H: [
		1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51,
		54, 57, 60, 63, 66, 70, 74, 77, 81,
	],
};

function lookup(table: LevelTable, version: QrVersion, level: QrErrorCorrection): number {
	const value = table[level][version - 1];
	if (value === undefined) throw new RangeError(`QR version ${version} is outside 1–40.`);
	return value;
}

/** Modules per side. */
export function symbolSize(version: QrVersion): number {
	return 17 + 4 * version;
}

/**
 * Modules left for data once every function pattern is placed — the closed form,
 * so the tables can be checked against geometry rather than against themselves.
 */
export function rawDataModules(version: QrVersion): number {
	let modules = (16 * version + 128) * version + 64;
	if (version >= 2) {
		const alignment = Math.floor(version / 7) + 2;
		modules -= (25 * alignment - 10) * alignment - 55;
		if (version >= 7) modules -= 36;
	}
	return modules;
}

/** Leftover modules after the last whole codeword — always 0, 3, 4 or 7. */
export function remainderBits(version: QrVersion): number {
	return rawDataModules(version) % 8;
}

export function totalCodewords(version: QrVersion): number {
	return Math.floor(rawDataModules(version) / 8);
}

export function dataCodewords(version: QrVersion, level: QrErrorCorrection): number {
	return totalCodewords(version) - lookup(EC_PER_BLOCK, version, level) * lookup(BLOCKS, version, level);
}

export type QrBlockLayout = {
	blocks: number;
	ecPerBlock: number;
	/** The first `count` blocks carry `data` data codewords… */
	short: { count: number; data: number };
	/** …and the rest carry one more. */
	long: { count: number; data: number };
};

export function blockLayout(version: QrVersion, level: QrErrorCorrection): QrBlockLayout {
	const blocks = lookup(BLOCKS, version, level);
	const ecPerBlock = lookup(EC_PER_BLOCK, version, level);
	const total = totalCodewords(version);
	const shortTotal = Math.floor(total / blocks);
	const longCount = total % blocks;

	return {
		blocks,
		ecPerBlock,
		short: { count: blocks - longCount, data: shortTotal - ecPerBlock },
		long: { count: longCount, data: shortTotal - ecPerBlock + 1 },
	};
}

/** Character-count indicator width in byte mode. */
function byteCountBits(version: QrVersion): number {
	return version <= 9 ? 8 : 16;
}

/** How many UTF-8 bytes one byte-mode segment can hold. */
export function byteCapacity(version: QrVersion, level: QrErrorCorrection): number {
	return Math.floor((dataCodewords(version, level) * 8 - 4 - byteCountBits(version)) / 8);
}

/**
 * Alignment-pattern centres on each axis. Evenly spaced from the far edge back
 * to 6, on even coordinates; version 32's step of 26 is the one the formula has
 * to be told.
 */
export function alignmentPositions(version: QrVersion): number[] {
	if (version === 1) return [];

	const count = Math.floor(version / 7) + 2;
	const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
	const positions = [6];
	for (let position = symbolSize(version) - 7; positions.length < count; position -= step) {
		positions.splice(1, 0, position);
	}
	return positions;
}
