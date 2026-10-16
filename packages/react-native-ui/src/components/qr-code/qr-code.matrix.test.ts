import { describe, expect, test } from "bun:test";
import { buildFunctionMap, drawFunctionPatterns, placeData } from "./qr-code.matrix";
import { rawDataModules, totalCodewords } from "./qr-code.tables";

function at(map: Uint8Array | Int16Array, size: number, row: number, col: number): number {
	return map[row * size + col] ?? Number.NaN;
}

describe("buildFunctionMap", () => {
	test("version 1 is 21 modules a side", () => {
		expect(buildFunctionMap(1).size).toBe(21);
		expect(buildFunctionMap(40).size).toBe(177);
	});

	test("reserves the three finder regions, separators included", () => {
		const { size, isFunction } = buildFunctionMap(1);
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				expect(at(isFunction, size, row, col)).toBe(1);
				expect(at(isFunction, size, row, size - 1 - col)).toBe(1);
				expect(at(isFunction, size, size - 1 - row, col)).toBe(1);
			}
		}
		expect(at(isFunction, size, size - 1, size - 1)).toBe(0);
	});

	test("reserves timing, the dark module and both format strips", () => {
		const { size, isFunction } = buildFunctionMap(1);
		for (let index = 0; index < size; index++) {
			expect(at(isFunction, size, 6, index)).toBe(1);
			expect(at(isFunction, size, index, 6)).toBe(1);
		}
		expect(at(isFunction, size, 4 * 1 + 9, 8)).toBe(1);
		for (let index = 0; index < 9; index++) {
			expect(at(isFunction, size, 8, index)).toBe(1);
			expect(at(isFunction, size, index, 8)).toBe(1);
		}
	});

	test.each([1, 2, 7, 14, 40])("version %i leaves exactly rawDataModules free", (version) => {
		const { isFunction } = buildFunctionMap(version);
		const free = isFunction.reduce((count, cell) => count + (cell ? 0 : 1), 0);
		expect(free).toBe(rawDataModules(version));
	});

	test("v1 -> 208, v2 -> 359, v7 -> 1568, v40 -> 29648 data modules", () => {
		expect(rawDataModules(1)).toBe(208);
		expect(rawDataModules(2)).toBe(359);
		expect(rawDataModules(7)).toBe(1568);
		expect(rawDataModules(40)).toBe(29648);
	});
});

describe("drawFunctionPatterns", () => {
	test("draws the finder ring, gap and core", () => {
		const { size, modules } = drawFunctionPatterns(1);
		const finderRow = [1, 1, 1, 1, 1, 1, 1, 0];
		const ringRow = [1, 0, 0, 0, 0, 0, 1, 0];
		const coreRow = [1, 0, 1, 1, 1, 0, 1, 0];
		const expected = [finderRow, ringRow, coreRow, coreRow, coreRow, ringRow, finderRow];
		for (let row = 0; row < 7; row++) {
			for (let col = 0; col < 8; col++) expect(at(modules, size, row, col)).toBe(expected[row]?.[col] ?? -1);
		}
	});

	test("the timing pattern alternates, dark on even indexes", () => {
		const { size, modules } = drawFunctionPatterns(2);
		for (let index = 8; index < size - 8; index++) {
			expect(at(modules, size, 6, index)).toBe(index % 2 === 0 ? 1 : 0);
			expect(at(modules, size, index, 6)).toBe(index % 2 === 0 ? 1 : 0);
		}
	});

	test("version 2's alignment pattern sits centred on (18, 18)", () => {
		const { size, modules } = drawFunctionPatterns(2);
		expect(at(modules, size, 18, 18)).toBe(1);
		expect(at(modules, size, 17, 18)).toBe(0);
		expect(at(modules, size, 16, 18)).toBe(1);
	});

	test("the dark module is always dark", () => {
		for (const version of [1, 7, 40]) {
			const { size, modules } = drawFunctionPatterns(version);
			expect(at(modules, size, 4 * version + 9, 8)).toBe(1);
		}
	});
});

describe("placeData", () => {
	test("the first codeword's MSB lands bottom-right on version 1", () => {
		const codewords = new Array(totalCodewords(1)).fill(0);
		codewords[0] = 0b10000000;
		const { modules, owner } = placeData(codewords, 1);
		expect(at(modules, 21, 20, 20)).toBe(1);
		expect(at(modules, 21, 20, 19)).toBe(0);
		expect(at(owner, 21, 20, 20)).toBe(0);
	});

	test("the zigzag climbs the first column pair, right before left", () => {
		const codewords = new Array(totalCodewords(1)).fill(0);
		codewords[0] = 0b01000000;
		const { modules, owner } = placeData(codewords, 1);
		expect(at(modules, 21, 20, 19)).toBe(1);
		expect(at(owner, 21, 19, 20)).toBe(0);
		expect(at(owner, 21, 17, 19)).toBe(0);
		expect(at(owner, 21, 16, 20)).toBe(1);
	});

	test("the vertical timing column is skipped", () => {
		const { owner } = placeData(new Array(totalCodewords(1)).fill(0), 1);
		for (let row = 0; row < 21; row++) expect(at(owner, 21, row, 6)).toBe(-1);
	});

	test.each([1, 2, 7, 21])("version %i: owner covers every codeword and every data module", (version) => {
		const total = totalCodewords(version);
		const { size, isFunction } = buildFunctionMap(version);
		const { owner } = placeData(new Array(total).fill(0), version);
		const counts = new Array<number>(total).fill(0);
		let remainder = 0;
		for (let index = 0; index < size * size; index++) {
			const cell = owner[index] ?? -1;
			if (isFunction[index]) expect(cell).toBe(-1);
			else if (cell === -1) remainder++;
			else counts[cell] = (counts[cell] ?? 0) + 1;
		}
		expect(counts.every((count) => count === 8)).toBe(true);
		expect(remainder).toBe(rawDataModules(version) - total * 8);
	});
});
