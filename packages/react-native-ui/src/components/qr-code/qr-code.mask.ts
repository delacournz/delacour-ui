import { QR_MASKS, type QrMask } from "./qr-code.constants";

/** Whether `mask` flips the module at (`row`, `col`). The standard's eight conditions. */
export function maskPredicate(mask: QrMask, row: number, col: number): boolean {
	switch (mask) {
		case 0:
			return (row + col) % 2 === 0;
		case 1:
			return row % 2 === 0;
		case 2:
			return col % 3 === 0;
		case 3:
			return (row + col) % 3 === 0;
		case 4:
			return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
		case 5:
			return ((row * col) % 2) + ((row * col) % 3) === 0;
		case 6:
			return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
		case 7:
			return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
	}
}

/** XORs a mask over every non-function module. Returns a copy; applying it twice restores the input. */
export function applyMask(modules: Uint8Array, isFunction: Uint8Array, size: number, mask: QrMask): Uint8Array {
	const out = modules.slice();
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			const index = row * size + col;
			if (!isFunction[index] && maskPredicate(mask, row, col)) out[index] = (out[index] ?? 0) ^ 1;
		}
	}
	return out;
}

/** Reads a line — row `n` or column `n` — as a function of its position. */
function lineReader(modules: Uint8Array, size: number, line: number, vertical: boolean): (index: number) => number {
	return vertical ? (index) => modules[index * size + line] ?? 0 : (index) => modules[line * size + index] ?? 0;
}

/** Rule 1: every run of five or more same-coloured modules in a row or column scores 3 + (length − 5). */
export function penaltyRule1(modules: Uint8Array, size: number): number {
	let score = 0;
	for (const vertical of [false, true]) {
		for (let line = 0; line < size; line++) {
			const read = lineReader(modules, size, line, vertical);
			let run = 1;
			for (let index = 1; index <= size; index++) {
				if (index < size && read(index) === read(index - 1)) {
					run++;
					continue;
				}
				if (run >= 5) score += 3 + (run - 5);
				run = 1;
			}
		}
	}
	return score;
}

/** Rule 2: every 2 x 2 block of one colour scores 3 (overlapping blocks each count). */
export function penaltyRule2(modules: Uint8Array, size: number): number {
	let score = 0;
	for (let row = 0; row < size - 1; row++) {
		for (let col = 0; col < size - 1; col++) {
			const colour = modules[row * size + col];
			if (
				colour === modules[row * size + col + 1] &&
				colour === modules[(row + 1) * size + col] &&
				colour === modules[(row + 1) * size + col + 1]
			) {
				score += 3;
			}
		}
	}
	return score;
}

/** 1011101 then 0000, as an 11-bit window read left to right. */
const FINDER_LIKE = 0b10111010000;
/** 0000 then 1011101. */
const FINDER_LIKE_REVERSED = 0b00001011101;
const WINDOW = 11;

/**
 * Rule 3: each dark-light-dark-dark-dark-light-dark run with four light modules
 * on one side, in a row or column, scores 40. Matched inside the symbol only —
 * the quiet zone is not counted as light.
 */
export function penaltyRule3(modules: Uint8Array, size: number): number {
	let score = 0;
	for (const vertical of [false, true]) {
		for (let line = 0; line < size; line++) {
			const read = lineReader(modules, size, line, vertical);
			let window = 0;
			for (let index = 0; index < size; index++) {
				window = ((window << 1) | read(index)) & 0x7ff;
				if (index >= WINDOW - 1 && (window === FINDER_LIKE || window === FINDER_LIKE_REVERSED)) score += 40;
			}
		}
	}
	return score;
}

/** Rule 4: 10 points for each whole 5% the dark share sits away from 50%. */
export function penaltyRule4(modules: Uint8Array, size: number): number {
	let dark = 0;
	for (const module of modules) dark += module;
	const percent = (dark * 100) / (size * size);
	return 10 * Math.floor(Math.abs(percent - 50) / 5);
}

export function scorePenalty(modules: Uint8Array, size: number): number {
	return (
		penaltyRule1(modules, size) +
		penaltyRule2(modules, size) +
		penaltyRule3(modules, size) +
		penaltyRule4(modules, size)
	);
}

/** The mask with the lowest score; a tie goes to the lowest index, so the choice is deterministic. */
export function chooseMask(score: (mask: QrMask) => number): QrMask {
	let best: QrMask = 0;
	let bestScore = Number.POSITIVE_INFINITY;
	for (const mask of QR_MASKS) {
		const value = score(mask);
		if (value < bestScore) {
			best = mask;
			bestScore = value;
		}
	}
	return best;
}
