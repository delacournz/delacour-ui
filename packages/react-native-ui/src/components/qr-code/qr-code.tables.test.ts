import { describe, expect, test } from "bun:test";
import { QR_ERROR_CORRECTIONS } from "./qr-code.constants";
import {
	alignmentPositions,
	blockLayout,
	byteCapacity,
	dataCodewords,
	QR_ALPHANUMERIC_CHARSET,
	QR_MAX_VERSION,
	rawDataModules,
	remainderBits,
	totalCodewords,
} from "./qr-code.tables";

const VERSIONS = Array.from({ length: QR_MAX_VERSION }, (_, index) => index + 1);

describe("totalCodewords", () => {
	test.each([
		[1, 26],
		[2, 44],
		[7, 196],
		[40, 3706],
	])("version %i holds %i codewords", (version, total) => {
		expect(totalCodewords(version)).toBe(total);
	});
});

describe("dataCodewords", () => {
	test.each([
		[1, "L", 19],
		[1, "M", 16],
		[1, "Q", 13],
		[1, "H", 9],
		[40, "L", 2956],
		[40, "H", 1276],
	] as const)("%i-%s carries %i data codewords", (version, level, data) => {
		expect(dataCodewords(version, level)).toBe(data);
	});
});

describe("blockLayout", () => {
	test("5-Q splits into two short and two long blocks", () => {
		expect(blockLayout(5, "Q")).toEqual({
			blocks: 4,
			ecPerBlock: 18,
			short: { count: 2, data: 15 },
			long: { count: 2, data: 16 },
		});
	});

	test("1-M is a single block", () => {
		expect(blockLayout(1, "M")).toEqual({
			blocks: 1,
			ecPerBlock: 10,
			short: { count: 1, data: 16 },
			long: { count: 0, data: 17 },
		});
	});
});

describe("byteCapacity", () => {
	test.each([
		[1, "L", 17],
		[1, "M", 14],
		[1, "Q", 11],
		[1, "H", 7],
		[10, "M", 213],
		[40, "L", 2953],
		[40, "M", 2331],
		[40, "Q", 1663],
		[40, "H", 1273],
	] as const)("%i-%s holds %i bytes", (version, level, bytes) => {
		expect(byteCapacity(version, level)).toBe(bytes);
	});
});

describe("closed-form invariants — the net for a typo in the tables", () => {
	test("total codewords match the module count for every version", () => {
		for (const version of VERSIONS) {
			expect(totalCodewords(version)).toBe(Math.floor(rawDataModules(version) / 8));
			expect([0, 3, 4, 7]).toContain(remainderBits(version));
		}
	});

	test("blocks x EC per block + data codewords === total, for all 160 pairs", () => {
		for (const version of VERSIONS) {
			for (const level of QR_ERROR_CORRECTIONS) {
				const layout = blockLayout(version, level);
				const data = layout.short.count * layout.short.data + layout.long.count * layout.long.data;
				expect(layout.blocks * layout.ecPerBlock + dataCodewords(version, level)).toBe(totalCodewords(version));
				expect(data).toBe(dataCodewords(version, level));
				expect(layout.short.count + layout.long.count).toBe(layout.blocks);
				expect(layout.long.data - layout.short.data).toBe(1);
			}
		}
	});

	test("capacity rises with version and falls with level", () => {
		for (const version of VERSIONS) {
			const byLevel = QR_ERROR_CORRECTIONS.map((level) => dataCodewords(version, level));
			expect([...byLevel].sort((a, b) => b - a)).toEqual(byLevel);
			if (version > 1) {
				for (const level of QR_ERROR_CORRECTIONS) {
					expect(dataCodewords(version, level)).toBeGreaterThan(dataCodewords(version - 1, level));
				}
			}
		}
	});
});

describe("rawDataModules", () => {
	test.each([
		[1, 208],
		[2, 359],
		[7, 1568],
		[40, 29648],
	])("version %i has %i data modules", (version, modules) => {
		expect(rawDataModules(version)).toBe(modules);
	});
});

describe("alignmentPositions", () => {
	test.each([
		[1, []],
		[2, [6, 18]],
		[7, [6, 22, 38]],
		[32, [6, 34, 60, 86, 112, 138]],
		[40, [6, 30, 58, 86, 114, 142, 170]],
	])("version %i", (version, positions) => {
		expect(alignmentPositions(version)).toEqual(positions);
	});

	test("the last centre is always six in from the far edge", () => {
		for (const version of VERSIONS.slice(1)) {
			expect(alignmentPositions(version).at(-1)).toBe(17 + 4 * version - 7);
		}
	});
});

test("the alphanumeric set is the 45 characters the standard names", () => {
	expect(QR_ALPHANUMERIC_CHARSET).toBe("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:");
});
