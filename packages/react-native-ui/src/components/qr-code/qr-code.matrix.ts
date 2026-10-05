import type { QrVersion } from "./qr-code.constants";
import { placeFormatWord, placeVersionWord } from "./qr-code.format";
import { alignmentPositions, symbolSize } from "./qr-code.tables";

/**
 * Function patterns, and the zigzag that lays codewords into what they leave.
 * Everything is row-major over a `size * size` array.
 */

export type QrFunctionLayer = {
	size: number;
	/** The function patterns drawn — finders, timing, alignment, version word, dark module. Format areas are light. */
	modules: Uint8Array;
	/** `1` wherever a function pattern, a format strip or a version block sits. */
	isFunction: Uint8Array;
};

const FUNCTION_LAYERS = new Map<QrVersion, QrFunctionLayer>();

/**
 * Draws every function pattern for a version and marks where they are.
 *
 * The version word is drawn here — it depends on nothing else. The format areas
 * are reserved with placeholder light modules: their bits depend on the level and
 * the mask, and are written after masking.
 * Memoised per version and returned as fresh copies, since callers mutate.
 */
export function drawFunctionPatterns(version: QrVersion): QrFunctionLayer {
	const cached = FUNCTION_LAYERS.get(version);
	if (cached) return { size: cached.size, modules: cached.modules.slice(), isFunction: cached.isFunction.slice() };

	const size = symbolSize(version);
	const modules = new Uint8Array(size * size);
	const isFunction = new Uint8Array(size * size);
	const set = (row: number, col: number, dark: number): void => {
		if (row < 0 || col < 0 || row >= size || col >= size) return;
		modules[row * size + col] = dark;
		isFunction[row * size + col] = 1;
	};

	for (let index = 0; index < size; index++) {
		set(6, index, index % 2 === 0 ? 1 : 0);
		set(index, 6, index % 2 === 0 ? 1 : 0);
	}

	for (const [centreRow, centreCol] of [
		[3, 3],
		[3, size - 4],
		[size - 4, 3],
	] as const) {
		for (let dy = -4; dy <= 4; dy++) {
			for (let dx = -4; dx <= 4; dx++) {
				const distance = Math.max(Math.abs(dx), Math.abs(dy));
				set(centreRow + dy, centreCol + dx, distance !== 2 && distance !== 4 ? 1 : 0);
			}
		}
	}

	const positions = alignmentPositions(version);
	const last = positions.length - 1;
	positions.forEach((row, i) => {
		positions.forEach((col, j) => {
			if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
			for (let dy = -2; dy <= 2; dy++) {
				for (let dx = -2; dx <= 2; dx++) {
					set(row + dy, col + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1 ? 1 : 0);
				}
			}
		});
	});

	placeFormatWord(0, size, (row, col) => set(row, col, 0));
	set(size - 8, 8, 1);
	placeVersionWord(version, size, set);

	FUNCTION_LAYERS.set(version, { size, modules, isFunction });
	return { size, modules: modules.slice(), isFunction: isFunction.slice() };
}

/** Where the function patterns are, for a version. */
export function buildFunctionMap(version: QrVersion): { size: number; isFunction: Uint8Array } {
	const { size, isFunction } = drawFunctionPatterns(version);
	return { size, isFunction };
}

/**
 * Lays the interleaved codewords into the free modules: two-column strips from
 * the right edge leftward, alternating up and down, skipping the vertical timing
 * column. Returns the unmasked data layer and which codeword owns each module.
 *
 * Function modules keep their drawn value; leftover remainder bits are light
 * and owned by nobody.
 */
export function placeData(
	codewords: readonly number[],
	version: QrVersion
): { modules: Uint8Array; owner: Int16Array; isFunction: Uint8Array } {
	const { size, modules, isFunction } = drawFunctionPatterns(version);
	const owner = new Int16Array(size * size).fill(-1);
	const totalBits = codewords.length * 8;
	let bitIndex = 0;

	for (let right = size - 1; right >= 1; right -= 2) {
		if (right === 6) right = 5;
		const upward = ((right + 1) & 2) === 0;
		for (let step = 0; step < size; step++) {
			const row = upward ? size - 1 - step : step;
			for (let offset = 0; offset < 2; offset++) {
				const index = row * size + right - offset;
				if (isFunction[index]) continue;
				if (bitIndex < totalBits) {
					const codeword = bitIndex >>> 3;
					modules[index] = ((codewords[codeword] ?? 0) >>> (7 - (bitIndex & 7))) & 1;
					owner[index] = codeword;
					bitIndex++;
				} else {
					modules[index] = 0;
				}
			}
		}
	}

	return { modules, owner, isFunction };
}
