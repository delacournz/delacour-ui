import type { QrErrorCorrection, QrMask, QrVersion } from "./qr-code.constants";

/** The two bits a format word gives each level — not in L-M-Q-H order. */
const LEVEL_BITS: Readonly<Record<QrErrorCorrection, number>> = { L: 1, M: 0, Q: 3, H: 2 };

/** BCH(15,5) generator, x^10 + x^8 + x^5 + x^4 + x^2 + x + 1. */
const FORMAT_GENERATOR = 0x537;
/** XORed over every format word so none is all-light. */
const FORMAT_MASK = 0x5412;
/** BCH(18,6) generator for the version word. */
const VERSION_GENERATOR = 0x1f25;

/** The 15-bit format word for a level and mask, already masked. */
export function formatWord(level: QrErrorCorrection, mask: QrMask): number {
	const data = (LEVEL_BITS[level] << 3) | mask;
	let remainder = data;
	for (let step = 0; step < 10; step++) remainder = (remainder << 1) ^ ((remainder >>> 9) * FORMAT_GENERATOR);
	return ((data << 10) | (remainder & 0x3ff)) ^ FORMAT_MASK;
}

/** The 18-bit version word, or `null` below version 7, which carries none. */
export function versionWord(version: QrVersion): number | null {
	if (version < 7) return null;
	let remainder = version;
	for (let step = 0; step < 12; step++) remainder = (remainder << 1) ^ ((remainder >>> 11) * VERSION_GENERATOR);
	return (version << 12) | (remainder & 0xfff);
}

/** Bit `index` of `word`, LSB first. */
function bit(word: number, index: number): number {
	return (word >>> index) & 1;
}

/**
 * Writes both copies of the format word: around the top-left finder, and split
 * between the top-right and bottom-left ones. `set(row, col, dark)`.
 */
export function placeFormatWord(
	word: number,
	size: number,
	set: (row: number, col: number, dark: number) => void
): void {
	for (let index = 0; index <= 5; index++) set(index, 8, bit(word, index));
	set(7, 8, bit(word, 6));
	set(8, 8, bit(word, 7));
	set(8, 7, bit(word, 8));
	for (let index = 9; index < 15; index++) set(8, 14 - index, bit(word, index));

	for (let index = 0; index < 8; index++) set(8, size - 1 - index, bit(word, index));
	for (let index = 8; index < 15; index++) set(size - 15 + index, 8, bit(word, index));
	set(size - 8, 8, 1);
}

/** Writes both 6 x 3 copies of the version word, beside the top-right and bottom-left finders. */
export function placeVersionWord(
	version: QrVersion,
	size: number,
	set: (row: number, col: number, dark: number) => void
): void {
	const word = versionWord(version);
	if (word === null) return;
	for (let index = 0; index < 18; index++) {
		const near = size - 11 + (index % 3);
		const far = Math.floor(index / 3);
		set(far, near, bit(word, index));
		set(near, far, bit(word, index));
	}
}
